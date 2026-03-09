import 'bootstrap/dist/css/bootstrap.min.css';

import Header from './components/Header.tsx'
import Borrow from './components/Borrow.tsx'
import Provide from './components/Provide.tsx'

import { createHashRouter, Outlet, RouterProvider } from "react-router-dom"

const Layout = () => {
  return(
    <div>
      <Header/>
      <Outlet/>
    </div>
  );
}

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Borrow />
      },
      {
        path: '/Provide',
        element: <Provide />
      },
    ]
  }
])

function App() {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  )
}

export default App