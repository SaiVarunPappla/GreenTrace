import { useState } from 'react';
import { Activity } from '@/lib/carbonCalculator';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2, CheckCircle } from 'lucide-react';
import { formatINR } from '@/lib/carbonCalculator';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ESGReportProps {
  activities: Activity[];
}

const ESGReport = ({ activities }: ESGReportProps) => {
  const [generating, setGenerating] = useState(false);

  const totalEmissions = activities.reduce((s, a) => s + a.calculateImpact(), 0);
  const transportTotal = activities.filter(a => a.category === 'transport').reduce((s, a) => s + a.calculateImpact(), 0);
  const dietTotal = activities.filter(a => a.category === 'diet').reduce((s, a) => s + a.calculateImpact(), 0);
  const utilityTotal = activities.filter(a => a.category === 'utility').reduce((s, a) => s + a.calculateImpact(), 0);
  const offsetCost = Math.ceil((totalEmissions / 1000) * 1250);

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
      doc.setFillColor(6, 78, 59); // #064E3B
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('GreenTrace India', 14, 20);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('ESG & Carbon Intelligence Report', 14, 30);
      doc.text(new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - 14, 30, { align: 'right' });

      // Summary section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 14, 55);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Carbon Emissions: ${totalEmissions.toFixed(2)} kg CO₂`, 14, 65);
      doc.text(`Total Activities Logged: ${activities.length}`, 14, 72);
      doc.text(`Estimated Offset Cost: ${formatINR(offsetCost)}`, 14, 79);
      doc.text(`Report Period: Current Month`, 14, 86);

      // Category breakdown table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Emissions by Category', 14, 100);

      autoTable(doc, {
        startY: 105,
        head: [['Category', 'Emissions (kg CO₂)', 'Percentage', 'Financial Impact (₹)']],
        body: [
          ['Transport', transportTotal.toFixed(2), `${totalEmissions > 0 ? ((transportTotal / totalEmissions) * 100).toFixed(1) : 0}%`, formatINR(transportTotal * 12)],
          ['Diet', dietTotal.toFixed(2), `${totalEmissions > 0 ? ((dietTotal / totalEmissions) * 100).toFixed(1) : 0}%`, formatINR(dietTotal * 5)],
          ['Utilities', utilityTotal.toFixed(2), `${totalEmissions > 0 ? ((utilityTotal / totalEmissions) * 100).toFixed(1) : 0}%`, formatINR(utilityTotal * 9.76)],
          ['Total', totalEmissions.toFixed(2), '100%', formatINR(transportTotal * 12 + dietTotal * 5 + utilityTotal * 9.76)],
        ],
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        footStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      });

      // Activities detail
      const finalY = (doc as any).lastAutoTable?.finalY || 160;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Activities', 14, finalY + 15);

      const activityRows = activities.slice(0, 20).map(a => [
        a.date.toLocaleDateString('en-IN'),
        a.category.charAt(0).toUpperCase() + a.category.slice(1),
        a.getDescription(),
        `${a.calculateImpact().toFixed(2)} kg`,
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Date', 'Category', 'Description', 'Impact']],
        body: activityRows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
      });

      // Footer
      const pages = doc.internal.pages.length - 1;
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          'GreenTrace India • AI Carbon Intelligence Platform • Designed for Green India Initiative 🇮🇳',
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`GreenTrace_ESG_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('ESG Report downloaded! 📊');
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
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Generate a professional PDF report summarizing your carbon footprint, financial waste, and recommendations for HR/management review.
        </p>

        {/* Preview stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-secondary/50 p-4">
            <p className="text-2xl font-display font-bold text-foreground">{activities.length}</p>
            <p className="text-xs text-muted-foreground">Activities</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <p className="text-2xl font-display font-bold text-foreground">{totalEmissions.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">kg CO₂</p>
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
