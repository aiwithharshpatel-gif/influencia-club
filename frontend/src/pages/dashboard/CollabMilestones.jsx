import { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, Upload, AlertCircle, ChevronRight,
  ExternalLink, FileText, Send, RotateCcw, Target, Loader2
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: {
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    dot: 'bg-gray-500',
    label: 'Pending',
    icon: Clock
  },
  in_progress: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
    label: 'In Progress',
    icon: Target
  },
  submitted: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-500',
    label: 'Under Review',
    icon: Upload
  },
  approved: {
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    dot: 'bg-green-500',
    label: 'Approved',
    icon: CheckCircle2
  },
  revision_requested: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
    label: 'Revision Needed',
    icon: RotateCcw
  }
};

const MilestoneCard = ({ milestone, onSubmit }) => {
  const [isExpanded, setIsExpanded] = useState(
    ['in_progress', 'revision_requested'].includes(milestone.status)
  );
  const [submissionUrl, setSubmissionUrl] = useState(milestone.submissionUrl || '');
  const [submissionNote, setSubmissionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const config = statusConfig[milestone.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const canSubmit = ['in_progress', 'revision_requested'].includes(milestone.status);

  const handleSubmit = async () => {
    if (!submissionUrl.trim() && !submissionNote.trim()) {
      toast.error('Please provide a submission URL or note');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(milestone.id, { submissionUrl, submissionNote });
      toast.success('Deliverable submitted for review!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`relative pl-8 pb-8 last:pb-0`}>
      {/* Timeline connector */}
      <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border last:hidden" />

      {/* Timeline dot */}
      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${config.bg} border-2 ${config.border}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${config.dot} ${milestone.status === 'in_progress' ? 'animate-pulse' : ''}`} />
      </div>

      {/* Card */}
      <div
        className={`rounded-xl border transition-all duration-300 ${
          canSubmit
            ? `${config.border} ${config.bg} shadow-lg shadow-${config.dot}/5`
            : 'border-border bg-bg-card'
        }`}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <StatusIcon size={20} className={config.color} />
            <div className="min-w-0">
              <h4 className="font-display text-base font-semibold text-white truncate">
                {milestone.title}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
                {milestone.dueDate && (
                  <span className="text-xs text-muted">
                    · Due {new Date(milestone.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight
            size={18}
            className={`text-muted transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
            {/* Description */}
            {milestone.description && (
              <p className="text-sm text-muted">{milestone.description}</p>
            )}

            {/* Existing submission */}
            {milestone.submissionUrl && (
              <div className="bg-bg/50 rounded-lg p-3">
                <div className="text-xs text-muted mb-1 flex items-center gap-1">
                  <FileText size={12} /> Submitted Deliverable
                </div>
                <a
                  href={milestone.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {milestone.submissionUrl}
                  <ExternalLink size={12} />
                </a>
                {milestone.submissionNote && (
                  <p className="text-xs text-muted mt-2">"{milestone.submissionNote}"</p>
                )}
                {milestone.submittedAt && (
                  <p className="text-xs text-muted mt-1">
                    Submitted on {new Date(milestone.submittedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Brand feedback */}
            {milestone.brandFeedback && (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                <div className="text-xs text-orange-400 mb-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} /> Brand Feedback
                </div>
                <p className="text-sm text-white">{milestone.brandFeedback}</p>
                {milestone.reviewedAt && (
                  <p className="text-xs text-muted mt-1">
                    {new Date(milestone.reviewedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Submit form */}
            {canSubmit && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted mb-1.5 font-medium">
                    Deliverable Link (Instagram post, Drive, etc.)
                  </label>
                  <input
                    type="url"
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="https://instagram.com/p/..."
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1.5 font-medium">
                    Note (optional)
                  </label>
                  <textarea
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    placeholder="Any additional context about this deliverable..."
                    rows={2}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors resize-none"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-soft text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            )}

            {/* Approved state */}
            {milestone.status === 'approved' && milestone.reviewedAt && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400" />
                <p className="text-sm text-green-400 font-medium">
                  Approved on {new Date(milestone.reviewedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CollabMilestones = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollab, setSelectedCollab] = useState(null);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const response = await api.get('/milestones/creator');
      if (response.data.success) {
        setCollaborations(response.data.collaborations);
        // Auto-select first collab that has milestones
        const first = response.data.collaborations.find(c => c.milestones.length > 0);
        if (first) setSelectedCollab(first.campaignCreatorId);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMilestone = async (milestoneId, data) => {
    await api.put(`/milestones/creator/${milestoneId}/submit`, data);
    await fetchMilestones(); // Refresh data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const activeCollab = collaborations.find(c => c.campaignCreatorId === selectedCollab);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-2">
        Milestones
      </h1>
      <p className="text-muted mb-8">
        Track your campaign deliverables and submit work for brand review.
      </p>

      {collaborations.length === 0 ? (
        <div className="bg-bg-card rounded-xl p-12 border border-border text-center">
          <div className="w-20 h-20 bg-purple-glow/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target size={40} className="text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            No Active Milestones
          </h2>
          <p className="text-muted mb-6">
            Milestones will appear here once a brand assigns deliverables to your collaboration.
          </p>
          <p className="text-sm text-muted">
            Apply to campaigns and get approved to start receiving milestones!
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Collaboration Selector */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">
              Campaigns
            </h3>
            {collaborations.map(collab => {
              const isSelected = selectedCollab === collab.campaignCreatorId;
              const hasMilestones = collab.milestones.length > 0;

              return (
                <button
                  key={collab.campaignCreatorId}
                  onClick={() => setSelectedCollab(collab.campaignCreatorId)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5'
                      : 'bg-bg-card border-border hover:border-primary/20'
                  }`}
                >
                  <div className="font-display text-sm font-semibold text-white truncate">
                    {collab.campaignTitle}
                  </div>
                  <div className="text-xs text-muted mt-1">{collab.brandName}</div>

                  {hasMilestones && (
                    <div className="mt-3">
                      {/* Progress bar */}
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted">Progress</span>
                        <span className="text-primary font-semibold">{collab.milestoneProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full transition-all duration-500"
                          style={{ width: `${collab.milestoneProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted mt-1.5">
                        {collab.approvedMilestones}/{collab.totalMilestones} completed
                      </div>
                    </div>
                  )}

                  {!hasMilestones && (
                    <div className="mt-2 text-xs text-muted/60 italic">
                      No milestones yet
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Milestone Timeline */}
          <div className="lg:col-span-2">
            {activeCollab && activeCollab.milestones.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-semibold text-white">
                    {activeCollab.campaignTitle}
                  </h3>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    activeCollab.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {activeCollab.status}
                  </span>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {activeCollab.milestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onSubmit={handleSubmitMilestone}
                    />
                  ))}
                </div>
              </div>
            ) : activeCollab ? (
              <div className="bg-bg-card rounded-xl p-8 border border-border text-center">
                <Clock size={32} className="text-muted mx-auto mb-3" />
                <p className="text-muted">
                  The brand hasn't assigned milestones for this campaign yet. Check back soon!
                </p>
              </div>
            ) : (
              <div className="bg-bg-card rounded-xl p-8 border border-border text-center">
                <Target size={32} className="text-muted mx-auto mb-3" />
                <p className="text-muted">
                  Select a campaign to view its milestones.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollabMilestones;
