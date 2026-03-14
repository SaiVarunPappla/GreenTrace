import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const PrivacyToggle = () => {
  const { user } = useAuth();
  const [privacyMode, setPrivacyMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('privacy_mode')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setPrivacyMode(data?.privacy_mode ?? false);
        setLoading(false);
      });
  }, [user]);

  const toggle = async () => {
    if (!user) return;
    const newValue = !privacyMode;
    const { error } = await supabase
      .from('profiles')
      .update({ privacy_mode: newValue } as any)
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update privacy setting');
    } else {
      setPrivacyMode(newValue);
      toast.success(
        newValue
          ? 'Privacy Mode ON — your travel logs are now anonymized'
          : 'Privacy Mode OFF — full data visible'
      );
    }
  };

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border p-6"
      style={{ background: 'var(--gradient-card)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground">Privacy Mode</h4>
            <p className="text-xs text-muted-foreground">
              Anonymize personal travel logs while contributing to corporate totals
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          className={`p-3 rounded-xl transition-all ${
            privacyMode
              ? 'bg-primary/20 text-primary'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {privacyMode && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-primary/80 bg-primary/10 rounded-lg p-3"
        >
          🔒 GDPR/Data Privacy compliant — your individual routes and times are hidden from
          department reports. Only aggregated emission totals are shared.
        </motion.p>
      )}
    </motion.div>
  );
};

export default PrivacyToggle;
