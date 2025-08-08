import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import LoadingSpinner from '../components/Common/LoadingSpinner';

// 懒加载页面组件
const ChatPage = lazy(() => import('../pages/Chat/ChatPage'));
const ChannelPage = lazy(() => import('../pages/Channel/ChannelPage'));
const FileTransferPage = lazy(() => import('../pages/FileTransfer/FileTransferPage'));
const SearchPage = lazy(() => import('../pages/Search/SearchPage'));
const NotFoundPage = lazy(() => import('../pages/Error/NotFoundPage'));

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/chat" replace />
      },
      {
        path: 'chat',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ChatPage />
          </Suspense>
        ),
        children: [
          {
            path: ':channelName',
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <ChatPage />
              </Suspense>
            )
          }
        ]
      },
      {
        path: 'channels',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ChannelPage />
          </Suspense>
        )
      },
      {
        path: 'files',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <FileTransferPage />
          </Suspense>
        )
      },
      {
        path: 'search',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SearchPage />
          </Suspense>
        )
      }
    ]
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <NotFoundPage />
      </Suspense>
    )
  }
]);

export default router;