import React, { useState } from 'react';
import { Bot, Video, Loader2, Upload, Share2 } from 'lucide-react';
import axios from 'axios';

interface VideoProject {
  topic: string;
  status: 'processing' | 'ready' | null;
  progress: number;
  videoUrl?: string;
}

function App() {
  const [videoProject, setVideoProject] = useState<VideoProject>({
    topic: '',
    status: null,
    progress: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoProject.topic) return;
    
    try {
      setVideoProject(prev => ({ ...prev, status: 'processing', progress: 0 }));
      
      const response = await axios.post('http://localhost:8000/api/create-video', {
        topic: videoProject.topic,
        duration: 30 // Default duration in seconds
      });

      if (response.data.status === 'success') {
        const videoId = response.data.video_path.split('_')[1].split('.')[0];
        const videoResponse = await axios.get(`http://localhost:8000/api/video/${videoId}`);
        
        setVideoProject(prev => ({
          ...prev,
          status: 'ready',
          progress: 100,
          videoUrl: videoResponse.data.video_url
        }));
      }
    } catch (error) {
      console.error('Error creating video:', error);
      alert('Failed to create video. Please try again.');
      setVideoProject(prev => ({ ...prev, status: null, progress: 0 }));
    }
  };

  const handleDownload = async () => {
    if (!videoProject.videoUrl) return;

    try {
      const response = await fetch(`http://localhost:8000${videoProject.videoUrl}`);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${videoProject.topic.slice(0, 30)}-video.mp4`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the video. Please try again.');
    }
  };

  const handleShare = () => {
    if (!videoProject.videoUrl) return;
    
    if (navigator.share) {
      navigator.share({
        title: 'My AI Generated Video',
        text: videoProject.topic,
        url: `http://localhost:8000${videoProject.videoUrl}`
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`http://localhost:8000${videoProject.videoUrl}`)
        .then(() => alert('Video URL copied to clipboard!'))
        .catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bot size={40} className="text-purple-400" />
            <h1 className="text-4xl font-bold">AI Video Creator</h1>
          </div>
          <p className="text-gray-300 text-lg">Transform your ideas into engaging videos using AI</p>
        </header>

        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium mb-2">
                What's your video about?
              </label>
              <textarea
                id="topic"
                rows={4}
                className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                placeholder="Explain the topic or story for your video..."
                value={videoProject.topic}
                onChange={(e) => setVideoProject(prev => ({ ...prev, topic: e.target.value }))}
              />
            </div>

            <button
              type="submit"
              disabled={!videoProject.topic || videoProject.status === 'processing'}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {videoProject.status === 'processing' ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing Video...
                </>
              ) : (
                <>
                  <Video size={20} />
                  Create Video
                </>
              )}
            </button>
          </form>

          {videoProject.status && (
            <div className="mt-8 space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {videoProject.status === 'processing' && 'Creating your video...'}
                    {videoProject.status === 'ready' && 'Video Ready!'}
                  </span>
                  <span className="text-sm text-purple-400">{videoProject.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${videoProject.progress}%` }}
                  />
                </div>
              </div>

              {videoProject.status === 'ready' && videoProject.videoUrl && (
                <>
                  <div className="rounded-lg overflow-hidden">
                    <video 
                      controls 
                      className="w-full"
                      src={`http://localhost:8000${videoProject.videoUrl}`}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={handleDownload}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <Upload size={20} />
                      Download
                    </button>
                    <button 
                      onClick={handleShare}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <Share2 size={20} />
                      Share
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium mb-2">1. Input Your Topic</h3>
              <p className="text-sm text-gray-300">Describe what you want your video to be about</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium mb-2">2. AI Processing</h3>
              <p className="text-sm text-gray-300">Our AI generates script and visuals</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium mb-2">3. Video Creation</h3>
              <p className="text-sm text-gray-300">Get your animated video with captions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;