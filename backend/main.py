from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from moviepy.editor import TextClip, ColorClip, CompositeVideoClip
import openai

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoRequest(BaseModel):
    topic: str
    duration: Optional[int] = 30

@app.post("/api/create-video")
async def create_video(request: VideoRequest):
    try:
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Generate script using OpenAI
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a video script writer. Create a short, engaging script about the given topic."},
                {"role": "user", "content": f"Write a {request.duration} second script about: {request.topic}"}
            ]
        )
        script = completion.choices[0].message.content

        # Create video components
        text_clip = TextClip(
            script,
            fontsize=70,
            color='white',
            size=(1280, 720),
            method='caption',
            align='center'
        )
        text_clip = text_clip.set_duration(request.duration)

        # Create background
        background = ColorClip(size=(1280, 720), color=(0, 0, 0))
        background = background.set_duration(request.duration)

        # Combine clips
        final_clip = CompositeVideoClip([background, text_clip])
        
        # Generate unique filename
        output_path = f"videos/output_{os.urandom(8).hex()}.mp4"
        os.makedirs("videos", exist_ok=True)
        
        # Write video file
        final_clip.write_videofile(
            output_path,
            fps=24,
            codec='libx264',
            audio_codec='aac'
        )

        return {"status": "success", "video_path": output_path}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/video/{video_id}")
async def get_video(video_id: str):
    video_path = f"videos/output_{video_id}.mp4"
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found")
    return {"video_url": f"/videos/{video_id}"}