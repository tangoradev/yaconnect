import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import TopicList from './TopicList';
import TrendingPanel from './TrendingPanel';
import Leaderboard from './Leaderboard';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';
import BadgeDisplay from './BadgeDisplay';

const ForumLayout = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex-1 max-w-xl">
          <SearchBar />
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <Link to="/forum/leaderboard" className="text-sm font-medium text-gray-600 hover:text-brand-orange">
            Classement
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Topics */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <TopicList />
          <BadgeDisplay />
        </div>

        {/* Main Content - Feed/Post */}
        <div className="lg:col-span-6">
          <Outlet />
        </div>

        {/* Right Sidebar - Trending/Stats */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <TrendingPanel />
          <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default ForumLayout;
