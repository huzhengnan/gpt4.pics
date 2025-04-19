'use client';

// 1. Remove useState and useEffect imports if no longer needed by other parts
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function UserMenu() {
  // Get user, logout, and isAuthenticated directly from AuthContext
  const { user, logout, isAuthenticated } = useAuth();
  // 2. Remove the local balance state and fetchBalance function
  // const [balance, setBalance] = useState<number>(0);
  // useEffect(() => { ... });
  // const fetchBalance = async () => { ... };

  // If not authenticated, show Login button
  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        Login
      </Link>
    );
  }

  // If authenticated, show user menu and credits
  return (
    <div className="flex items-center space-x-4">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-medium">Credits: </span>
        {/* 3. Display balance directly from the user object in AuthContext */}
        <span className="text-indigo-600 dark:text-indigo-400">{user?.balance ?? 0}</span>
      </div>

      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center space-x-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <span className="sr-only">Open user menu</span>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user?.username ?? ''} className="h-8 w-8 rounded-full" />
              ) : (
                <span className="text-sm font-medium">{user?.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="hidden md:block text-gray-700 dark:text-gray-300">{user?.username}</span>
          </div>
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/profile"
                  className={`${
                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } block px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                >
                  Profile
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/settings"
                  className={`${
                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } block px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                >
                  Settings
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                >
                  Logout
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}