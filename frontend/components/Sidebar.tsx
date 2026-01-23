'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../app/context/AuthContext';
import { Activity, Users, GitCompare, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Activity },
        { name: 'Friends', href: '/friends', icon: Users },
        { name: 'Compare', href: '/compare', icon: GitCompare },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen w-64 flex-col bg-gray-900 border-r border-gray-800">
            {/* Logo */}
            <div className="flex h-16 items-center px-6 border-b border-gray-800">
                <Activity className="h-6 w-6 text-blue-500" />
                <span className="ml-3 text-xl font-bold text-blue-500">Arc</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                ? 'bg-gray-800 text-blue-500'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                                }`}
                        >
                            <Icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="border-t border-gray-800 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                            {user?.username ? user.username.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-300 truncate">
                            {user?.username || user?.email?.split('@')[0] || 'User'}
                        </span>
                    </div>
                    <button
                        onClick={logout}
                        className="ml-2 text-gray-400 hover:text-gray-200 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
