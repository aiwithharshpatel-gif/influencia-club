import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import api from '../utils/api';
import CreatorCard from '../components/CreatorCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Creators = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    city: 'all',
    search: ''
  });

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'influencer', label: 'Influencers' },
    { value: 'actor', label: 'Actors' },
    { value: 'model', label: 'Models' },
    { value: 'creator', label: 'Content Creators' },
    { value: 'public_figure', label: 'Public Figures' },
  ];

  const cities = [
    { value: 'all', label: 'All Cities' },
    { value: 'Ahmedabad', label: 'Ahmedabad' },
    { value: 'Surat', label: 'Surat' },
    { value: 'Vadodara', label: 'Vadodara' },
    { value: 'Rajkot', label: 'Rajkot' },
    { value: 'Other', label: 'Other' },
  ];

  useEffect(() => {
    fetchCreators();
  }, [filters]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.city !== 'all') params.append('city', filters.city);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/creators?${params}`);
      if (response.data.success) {
        setCreators(response.data.creators);
      }
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-5xl font-bold text-white mb-4">
            Our <span className="gold-text">Creators</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl">
            Discover talented creators from across Gujarat and India
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-bg-card border-y border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Category Filter */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFilters({ ...filters, category: cat.value })}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      filters.category === cat.value
                        ? 'bg-primary text-white'
                        : 'bg-bg-card border border-border text-muted hover:border-primary'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search & City Filter */}
            <div className="flex gap-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full md:w-64 bg-bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-white placeholder-muted focus:outline-none focus:border-primary"
                />
              </div>

              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="bg-bg-card border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              >
                {cities.map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted">Loading creators...</p>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted text-lg">No creators found</p>
              <p className="text-muted text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Creators;
