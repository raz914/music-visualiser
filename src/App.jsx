import Canvas from "./components/Canvas/Canvas";
import Landing from "./components/Landing/Landing";
import Dropzone from "./components/Dropzone/Dropzone";
import Tracks from "./components/Tracks/Tracks";
import Picker from "./components/Picker/Picker";
import AudioPlayer from "./components/AudioPlayer/AudioPlayer";

function App() {
  return (
    <>
      <Landing />
      <Dropzone />
      <Picker />
      <Tracks />
      <Canvas />
      <AudioPlayer />
    </>
  );
}

export default App;
