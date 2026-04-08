import { useState } from 'react';
import { Activity } from '@/lib/carbonCalculator';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/carbonCalculator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ESGReportProps {
  activities: Activity[];
}

const ESGReport = ({ activities }: ESGReportProps) => {
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();

  const totalEmissions = activities.reduce((s, a) => s + a.calculateImpact(), 0);
  const transportTotal = activities.filter(a => a.category === 'transport').reduce((s, a) => s + a.calculateImpact(), 0);
  const dietTotal = activities.filter(a => a.category === 'diet').reduce((s, a) => s + a.calculateImpact(), 0);
  const utilityTotal = activities.filter(a => a.category === 'utility').reduce((s, a) => s + a.calculateImpact(), 0);
  const offsetCost = Math.ceil((totalEmissions / 1000) * 1250);

  // 2026 Indian cost rates
  const fuelWaste = transportTotal * 12; // ₹12/kg CO2 from transport (petrol ~₹100/L)
  const electricityWaste = utilityTotal * 9.76; // ₹8/kWh / 0.82 factor
  const dietWaste = dietTotal * 5;
  const totalWaste = fuelWaste + electricityWaste + dietWaste;

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Employee';
  const employeeEmail = user?.email || 'N/A';

  const generatePDF = async () => {
    if (activities.length === 0) {
      toast.error('No activities to report. Log some activities first.');
      return;
    }

    setGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(6, 78, 59);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('GreenTrace India', 14, 18);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('ESG & Carbon Intelligence Report', 14, 28);
      doc.setFontSize(9);
      doc.text(`Employee: ${displayName} (${employeeEmail})`, 14, 38);
      doc.text(
        new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
        pageWidth - 14, 38, { align: 'right' }
      );

      // Summary section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 14, 58);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`Employee Name: ${displayName}`, 14, 68);
      doc.text(`Email: ${employeeEmail}`, 14, 75);
      doc.text(`Total Carbon Emissions: ${totalEmissions.toFixed(2)} kg CO2`, 14, 82);
      doc.text(`Total Activities Logged: ${activities.length}`, 14, 89);
      doc.text(`Financial Waste (INR): ${formatINR(totalWaste)}`, 14, 96);
      doc.text(`Estimated Offset Cost: ${formatINR(offsetCost)}`, 14, 103);

      // Category breakdown table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Emissions by Category', 14, 118);

      autoTable(doc, {
        startY: 123,
        head: [['Category', 'Emissions (kg CO2)', 'Percentage', 'Financial Waste (INR)']],
        body: [
          ['Transport', transportTotal.toFixed(2), `${totalEmissions > 0 ? ((transportTotal / totalEmissions) * 100).toFixed(1) : 0}%`, formatINR(fuelWaste)],
          ['Diet', dietTotal.toFixed(2), `${totalEmissions > 0 ? ((dietTotal / totalEmissions) * 100).toFixed(1) : 0}%`, formatINR(dietWaste)],
          ['Utilities', utilityTotal.toFixed(2), `${totalEmissions > 0 ? ((utilityTotal / totalEmissions) * 100).toFixed(1) : 0}%`, formatINR(electricityWaste)],
          ['Total', totalEmissions.toFixed(2), '100%', formatINR(totalWaste)],
        ],
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        footStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      });

      // Indian cost rates reference
      const tableEndY = (doc as any).lastAutoTable?.finalY || 180;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text('Rates: Petrol ~Rs.100/L | Diesel ~Rs.90/L | Electricity ~Rs.8/kWh | Grid: 0.82 kg CO2/kWh (2026 India)', 14, tableEndY + 8);

      // Activities detail
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Recent Activities', 14, tableEndY + 20);

      const activityRows = activities.slice(0, 25).map(a => [
        a.date.toLocaleDateString('en-IN'),
        a.category.charAt(0).toUpperCase() + a.category.slice(1),
        a.getDescription(),
        `${a.calculateImpact().toFixed(2)} kg`,
      ]);

      autoTable(doc, {
        startY: tableEndY + 25,
        head: [['Date', 'Category', 'Description', 'Impact']],
        body: activityRows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
      });

      // Recommendations
      const activitiesEndY = (doc as any).lastAutoTable?.finalY || 220;
      if (activitiesEndY < 250) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 78, 59);
        doc.text('Recommendations', 14, activitiesEndY + 15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const recs = [
          '- Switch daily commute to Metro/Bus to reduce transport emissions by up to 70%',
          '- Use off-peak hours (before 9 AM, after 9 PM) for heavy appliance usage',
          '- Incorporate 2+ plant-based meals per week to lower diet carbon footprint',
          `- Potential annual savings: ${formatINR(totalWaste * 6)} by adopting green habits`,
        ];
        recs.forEach((r, i) => {
          doc.text(r, 14, activitiesEndY + 25 + i * 7);
        });
      }

      // Footer on all pages
      const pages = doc.internal.pages.length - 1;
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `GreenTrace India | ESG Report for ${displayName} | Generated ${new Date().toLocaleDateString('en-IN')} | Page ${i}/${pages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`GreenTrace_ESG_${displayName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('ESG Report downloaded successfully! 📊');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border p-8"
      style={{
        background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="text-center">
        <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-display font-bold text-foreground mb-2">
          ESG Sustainability Report
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          Report for: <span className="font-semibold text-foreground">{displayName}</span>
        </p>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
          Generate a professional PDF with your emission stats, financial waste analysis, and personalised recommendations.
        </p>

        {/* Preview stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl bg-secondary/50 p-4">
            <p className="text-2xl font-display font-bold text-foreground">{activities.length}</p>
            <p className="text-xs text-muted-foreground">Activities</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <p className="text-2xl font-display font-bold text-foreground">{totalEmissions.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">kg CO2</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <p className="text-2xl font-display font-bold text-destructive">{formatINR(totalWaste)}</p>
            <p className="text-xs text-muted-foreground">Waste (INR)</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <p className="text-2xl font-display font-bold text-primary">{formatINR(offsetCost)}</p>
            <p className="text-xs text-muted-foreground">Offset Cost</p>
          </div>
        </div>

        <button
          onClick={generatePDF}
          disabled={generating}
          className="eco-button inline-flex items-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate ESG Report (PDF)
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ESGReport;
