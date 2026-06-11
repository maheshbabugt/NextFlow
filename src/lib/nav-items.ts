import {
  Home,
  Cpu,
  GitFork,
  FolderOpen,
  Type,
  Image,
  Video,
  Bot,
  Crop,
  Film,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Home", href: "/dashboard", icon: Home },
      { label: "Train Lora", href: "/dashboard/train-lora", icon: Cpu },
      { label: "Node Editor", href: "/dashboard/node-editor", icon: GitFork },
      { label: "Assets", href: "/dashboard/assets", icon: FolderOpen },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Text", href: "/dashboard/tools/text", icon: Type },
      { label: "Image", href: "/dashboard/tools/image", icon: Image },
      { label: "Video", href: "/dashboard/tools/video", icon: Video },
      { label: "LLM", href: "/dashboard/tools/llm", icon: Bot },
      { label: "Crop", href: "/dashboard/tools/crop", icon: Crop },
      { label: "Extract", href: "/dashboard/tools/extract", icon: Film },
    ],
  },
];
