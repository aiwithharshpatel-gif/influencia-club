import { useState, useEffect } from 'react';
import { Briefcase, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../../utils/api';

const Collaborations = () => {
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollabs();
  }, []);

  const fetchCollabs = async () => {
    try {
      const response = await api.get('/dashboard/collabs');
      if (response.data.success) {
        setCollabs(response.data.collabs);
      }
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'invited':
        return <Clock size={20} className="text-yellow-400" />;
      case 'confirmed':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'completed':
        return <CheckCircle size={20} className="text-primary" />;
      default:
        return <XCircle size={20} className="text-muted" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      invited: 'bg-yellow-500/20 text-yellow-400',
      confirmed: 'bg-green-500/20 text-green-400',
      completed: 'bg-primary/20 text-primary',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-muted/20 text-muted'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-8">
        Collaborations
      </h1>

      {collabs.length === 0 ? (
        <div className="bg-bg-card rounded-xl p-12 border border-border text-center">
          <div className="w-20 h-20 bg-purple-glow/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase size={40} className="text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            No Collaborations Yet
          </h2>
          <p className="text-muted mb-6">
            Brand collaboration requests will appear here
          </p>
          <p className="text-sm text-muted">
            Keep your profile updated and stay active to increase your chances!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {collabs.map((collab) => (
            <div
              key={collab.id}
              className="bg-bg-card rounded-xl p-6 border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-glow/20 rounded-lg flex items-center justify-center">
                    <Briefcase size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white">
                      {collab.campaign.brandInquiry.brandName}
                    </h3>
                    <p className="text-muted text-sm">
                      {collab.campaign.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(collab.status)}
                  {getStatusBadge(collab.status)}
                </div>
              </div>

              {collab.deliverables && (
                <div className="bg-bg rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium text-white mb-2">Deliverables:</div>
                  <p className="text-muted text-sm">{collab.deliverables}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-muted">
                <span>
                  Package: <span className="text-white capitalize">{collab.campaign.brandInquiry.packageType || 'N/A'}</span>
                </span>
                <span>
                  {new Date(collab.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collaborations;
