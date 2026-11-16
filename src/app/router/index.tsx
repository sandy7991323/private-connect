import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { LandingPage } from '../../features/rooms/LandingPage';
import { CreateRoomPage } from '../../features/rooms/CreateRoomPage';
import { RoomWaitingPage } from '../../features/rooms/RoomWaitingPage';
import { ActiveRoomPage } from '../../features/rooms/ActiveRoomPage';
import { InvalidRoomPage } from '../../features/rooms/InvalidRoomPage';
import { ConnectionErrorPage } from '../../features/rooms/ConnectionErrorPage';
import { NotFoundPage } from '../../features/rooms/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'create',
        element: <CreateRoomPage />,
      },
      {
        path: 'waiting/:roomId',
        element: <RoomWaitingPage />,
      },
      {
        path: 'room/:roomId',
        element: <ActiveRoomPage />,
      },
      {
        path: 'invalid-room',
        element: <InvalidRoomPage />,
      },
      {
        path: 'connection-error',
        element: <ConnectionErrorPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
