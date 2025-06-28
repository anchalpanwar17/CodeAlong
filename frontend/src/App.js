import './App.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import { Toaster } from 'react-hot-toast';
import EditorPage from './pages/EditorPage';


function App() {
  return (
    <>
    <div>
      <Toaster position= "top-right" toastOptions={{
        success : {
          iconTheme : {
            primary : '#590099',
          },
        },
      }}>
      </Toaster>
    </div>
      <BrowserRouter>
       <Routes>
        <Route path = "/" element = {<Home/>}></Route>
        <Route path= "/EditorPage/:roomId" element = {<EditorPage/>}> </Route>
       </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
