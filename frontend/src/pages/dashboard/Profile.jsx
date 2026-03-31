import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchProfile();
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

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      setSuccess(false);
      
      const response = await api.put('/me', data);
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
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
        Edit Profile
      </h1>

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6 flex items-center">
          <CheckCircle size={20} className="mr-2" />
          Profile updated successfully!
        </div>
      )}

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
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                placeholder="@username"
              />
              {errors.instagram && (
                <p className="text-red-500 text-sm mt-1">{errors.instagram.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Follower Count
              </label>
              <input
                type="text"
                {...register('followerCount')}
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                placeholder="e.g., 50K+, 1.2L+"
              />
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
    </div>
  );
};

export default Profile;
