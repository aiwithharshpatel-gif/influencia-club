import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, CheckCircle, Star, Instagram, Heart, MessageCircle, TrendingUp, RefreshCw, Unlink } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [igProfile, setIgProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [igLoading, setIgLoading] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchProfile();
    fetchInstagramProfile();
  }, []);

  useEffect(() => {
    const handleOAuthMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'instagram-oauth-success') {
        const { code, username } = event.data;
        try {
          setIgLoading(true);
          const res = await api.post('/creators/instagram/connect', { code, username });
          if (res.data.success) {
            toast.success('Instagram business profile connected successfully!');
            // Refresh states
            await fetchProfile();
            await fetchInstagramProfile();
          }
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.message || 'Failed to connect Instagram profile');
        } finally {
          setIgLoading(false);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/dashboard/overview');
      if (response.data.success) {
        const creator = response.data.data.creator;
        setProfile(creator);
        
        // Set form values
        Object.keys(creator).forEach(key => {
          if (creator[key] !== null) {
            setValue(key, creator[key]);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstagramProfile = async () => {
    try {
      const response = await api.get('/creators/instagram/profile');
      if (response.data.success && response.data.profile) {
        setIgProfile(response.data.profile);
      } else {
        setIgProfile(null);
      }
    } catch (error) {
      console.error('Error fetching connected Instagram profile:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      setSuccess(false);
      
      const response = await api.put('/me', data);
      if (response.data.success) {
        setSuccess(true);
        toast.success('Profile updated successfully!');
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectInstagram = async () => {
    try {
      setIgLoading(true);
      const res = await api.get('/auth/instagram/auth-url');
      const authUrl = res.data.url;

      const width = 520;
      const height = 680;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(
        authUrl,
        'Instagram Connection',
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to initiate Instagram connection');
    } finally {
      setIgLoading(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Instagram Professional Account? Your sync metrics will be deleted.')) {
      return;
    }

    try {
      setIgLoading(true);
      const response = await api.post('/creators/instagram/disconnect');
      if (response.data.success) {
        toast.success('Instagram disconnected successfully');
        setIgProfile(null);
        await fetchProfile(); // refresh followerCount inside form
      }
    } catch (error) {
      console.error('Error disconnecting Instagram:', error);
      toast.error('Failed to disconnect Instagram profile');
    } finally {
      setIgLoading(false);
    }
  };

  const handleSyncInstagram = async () => {
    try {
      setIgLoading(true);
      const response = await api.post('/creators/instagram/refresh');
      if (response.data.success) {
        toast.success(response.data.message || 'Instagram metrics synchronized successfully!');
        setIgProfile(response.data.profile);
        await fetchProfile(); // refresh followerCount inside form
      }
    } catch (error) {
      console.error('Error syncing Instagram:', error);
      toast.error(error.response?.data?.message || 'Failed to synchronize Instagram metrics');
    } finally {
      setIgLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Parse recent posts if connected
  let postsList = [];
  if (igProfile?.recentPosts) {
    try {
      postsList = typeof igProfile.recentPosts === 'string'
        ? JSON.parse(igProfile.recentPosts)
        : igProfile.recentPosts;
    } catch (e) {
      postsList = [];
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <h1 className="font-display text-3xl font-bold text-white">
        Edit Profile
      </h1>

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle size={20} className="mr-2" />
          Profile updated successfully!
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-bg-card rounded-xl p-6 border border-border">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-purple-glow rounded-full flex items-center justify-center">
              {profile?.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div>
              <button
                type="button"
                className="btn-outline text-sm py-2 px-4"
              >
                <Upload size={16} className="inline mr-2" />
                Change Photo
              </button>
              <p className="text-muted text-sm mt-2">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Full Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                disabled
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-muted cursor-not-allowed"
              />
              <p className="text-muted text-xs mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Instagram Handle
              </label>
              <input
                type="text"
                {...register('instagram')}
                disabled={igProfile !== null}
                className={`w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary ${igProfile ? 'text-muted cursor-not-allowed' : ''}`}
                placeholder="@username"
              />
              {igProfile && (
                <p className="text-emerald-500 text-xs mt-1 flex items-center">
                  <CheckCircle size={12} className="mr-1" /> Connected & Synced with Instagram
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Follower Count
              </label>
              <input
                type="text"
                {...register('followerCount')}
                disabled={igProfile !== null}
                className={`w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary ${igProfile ? 'text-muted cursor-not-allowed' : ''}`}
                placeholder="e.g., 50K+, 1.2L+"
              />
              {igProfile && (
                <p className="text-muted text-xs mt-1">Followers synced automatically</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Category
              </label>
              <select
                {...register('category')}
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              >
                <option value="influencer">Influencer</option>
                <option value="actor">Actor</option>
                <option value="model">Model</option>
                <option value="creator">Content Creator</option>
                <option value="public_figure">Public Figure</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                City
              </label>
              <select
                {...register('city')}
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
              >
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Surat">Surat</option>
                <option value="Vadodara">Vadodara</option>
                <option value="Rajkot">Rajkot</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Bio
            </label>
            <textarea
              {...register('bio')}
              rows={4}
              maxLength={200}
              className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary resize-none"
              placeholder="Tell us about yourself (max 200 characters)"
            />
            <p className="text-muted text-xs mt-1">
              {profile?.bio?.length || 0}/200 characters
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              {profile?.isVerified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/20 text-primary">
                  <CheckCircle size={14} className="mr-1" />
                  Verified
                </span>
              )}
              {profile?.isFeatured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gold/20 text-gold">
                  <Star size={14} className="mr-1" />
                  Featured
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-8 py-3 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Instagram Integration Card */}
      <div className="bg-bg-card rounded-xl p-6 border border-border relative overflow-hidden">
        {igLoading && (
          <div className="absolute inset-0 bg-[#09090b]/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <RefreshCw size={24} className="animate-spin text-primary" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
          <div className="flex items-start space-x-3 text-left">
            <div className="p-2.5 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-xl">
              <Instagram size={24} className="stroke-[2]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Instagram Integration</h3>
              <p className="text-muted text-xs mt-0.5">
                Connect your business account to display live follower counts, recent media feed, and engagement rate metrics.
              </p>
            </div>
          </div>

          {!igProfile ? (
            <button
              onClick={handleConnectInstagram}
              className="bg-gradient-to-r from-[#e1306c] to-[#c13584] hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(225,48,108,0.2)]"
            >
              Connect Instagram
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncInstagram}
                disabled={igLoading}
                className="bg-primary hover:bg-primary-soft text-black px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                id="sync-instagram-btn"
              >
                <RefreshCw size={14} className={igLoading ? 'animate-spin' : ''} />
                <span>Sync Metrics</span>
              </button>

              <button
                onClick={handleDisconnectInstagram}
                disabled={igLoading}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
              >
                <Unlink size={14} />
                <span>Disconnect Profile</span>
              </button>
            </div>
          )}
        </div>

        {igProfile ? (
          <div className="space-y-6">
            {/* Connected Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg p-4 rounded-xl border border-border/80 flex flex-col items-center">
                <span className="text-muted text-xs mb-1">Followers</span>
                <span className="text-white text-lg font-bold">
                  {igProfile.followersCount?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="bg-bg p-4 rounded-xl border border-border/80 flex flex-col items-center">
                <span className="text-muted text-xs mb-1">Engagement Rate</span>
                <span className="text-primary text-lg font-bold flex items-center">
                  <TrendingUp size={16} className="mr-1 text-[#d4af37]" />
                  {igProfile.engagementRate}%
                </span>
              </div>
              <div className="bg-bg p-4 rounded-xl border border-border/80 flex flex-col items-center">
                <span className="text-muted text-xs mb-1">Average Likes</span>
                <span className="text-white text-lg font-bold flex items-center">
                  <Heart size={16} className="mr-1 text-red-500 fill-red-500/20" />
                  {igProfile.avgLikes?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="bg-bg p-4 rounded-xl border border-border/80 flex flex-col items-center">
                <span className="text-muted text-xs mb-1">Average Comments</span>
                <span className="text-white text-lg font-bold flex items-center">
                  <MessageCircle size={16} className="mr-1 text-blue-400" />
                  {igProfile.avgComments?.toLocaleString() || '0'}
                </span>
              </div>
            </div>

            {/* Media Feed Preview */}
            <div>
              <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4 text-left">
                Recent Posts Feed Preview
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {postsList.length > 0 ? (
                  postsList.map((post) => (
                    <a
                      key={post.id}
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group aspect-square rounded-lg border border-border relative overflow-hidden bg-bg"
                    >
                      <img
                        src={post.mediaUrl}
                        alt={post.caption || 'Instagram Post'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Dark overlay on hover */}
                      <div className="absolute inset-0 bg-[#09090b]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-1.5 p-2 text-center">
                        <p className="text-[9px] text-[#a1a1aa] line-clamp-2 px-1 mb-1">
                          {post.caption}
                        </p>
                        <div className="flex items-center space-x-3 text-xs font-medium">
                          <span className="flex items-center text-red-500">
                            <Heart size={11} className="mr-0.5 fill-red-500" />
                            {post.likeCount >= 1000 ? `${(post.likeCount / 1000).toFixed(1)}k` : post.likeCount}
                          </span>
                          <span className="flex items-center text-blue-400">
                            <MessageCircle size={11} className="mr-0.5 fill-blue-400/20" />
                            {post.commentsCount}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-muted text-xs py-4 col-span-full text-center">
                    No recent posts found.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center bg-bg/40 border border-dashed border-border rounded-xl">
            <span className="text-muted text-xs">No Instagram profile connected.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
