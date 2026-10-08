export const revalidate = 0;

type Template = {
  id: string;
  label: string;
  category: string;
  prompt: string;
  description: string;
  previewBefore: string;
  previewAfter: string;
  model: string;
  credits: number;
};

const TEMPLATES: Template[] = [
  {
    id: "reimagine",
    label: "Reimagine",
    category: "Photo Edit",
    prompt: "Reimagine this photo in a modern cinematic style",
    description:
      "Reimagine your photo into a chosen look — chibi, comic, 3D, 70s street, 80s anime, or a warm Sunday-morning film look.",
    previewBefore: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    previewAfter: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80&sat=-100",
    model: "fal-ai/ltx-2/image-to-video/fast",
    credits: 2,
  },
  {
    id: "chibi",
    label: "Chibi",
    category: "Photo Edit",
    prompt: "Turn this photo into a chibi-style 3D character",
    description: "Turn your portrait into a cute chibi-style 3D character.",
    previewBefore: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80",
    previewAfter: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80&sat=100",
    model: "fal-ai/ltx-2/image-to-video/fast",
    credits: 2,
  },
  {
    id: "loop",
    label: "Loop",
    category: "Video",
    prompt: "Create a seamless loop of this scene",
    description: "Turn any scene into a hypnotic, seamless loop.",
    previewBefore: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    previewAfter: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&blur=2",
    model: "fal-ai/ltx-video-13b-distilled",
    credits: 2,
  },
  {
    id: "bg-removal",
    label: "BG Removal & Change",
    category: "Photo Edit",
    prompt: "Remove the background and place the subject in a new setting",
    description: "Remove any background and drop the subject into a new world.",
    previewBefore: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    previewAfter: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80",
    model: "fal-ai/ltx-2/image-to-video/fast",
    credits: 2,
  },
  {
    id: "headshot",
    label: "Professional Headshot",
    category: "Photo Edit",
    prompt: "Professional studio headshot with soft key light and neutral background",
    description: "Transform any photo into a professional studio headshot.",
    previewBefore: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    previewAfter: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
    model: "fal-ai/ltx-2/image-to-video/fast",
    credits: 2,
  },
  {
    id: "ecommerce",
    label: "E-Commerce Photos",
    category: "Product",
    prompt: "Clean product shot on a studio background with soft shadows",
    description: "Turn any product photo into a clean e-commerce shot.",
    previewBefore: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    previewAfter: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&brightness=20",
    model: "fal-ai/ltx-2/image-to-video/fast",
    credits: 2,
  },
  {
    id: "smart-resize",
    label: "Smart Resize",
    category: "Photo Edit",
    prompt: "Smartly resize and reframe to a cinematic 16:9 aspect",
    description: "Intelligently resize and reframe while keeping subject in focus.",
    previewBefore: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
    previewAfter: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80&sat=20",
    model: "fal-ai/ltx-video-13b-distilled",
    credits: 2,
  },
  {
    id: "space",
    label: "Space Scene",
    category: "Cinematic",
    prompt:
      "Cinematic space scene, nebula, a small figure standing on the edge, glowing teal particles",
    description: "Drop your subject into a vast cosmic scene.",
    previewBefore: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80",
    previewAfter: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80",
    model: "fal-ai/ltx-video-13b-distilled",
    credits: 2,
  },
];

export async function GET() {
  return Response.json({ templates: TEMPLATES });
}