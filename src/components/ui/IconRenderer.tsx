import { 
  Clipboard, 
  Hourglass, 
  FileText, 
  Pen, 
  MessageSquare, 
  Users, 
  Edit, 
  PartyPopper, 
  Bell, 
  Check, 
  AlertTriangle,
  type LucideProps
} from 'lucide-react';

interface IconRendererProps extends LucideProps {
  icon: string;
}

const iconMap: Record<string, React.FC<LucideProps>> = {
  clipboard: Clipboard,
  hourglass: Hourglass,
  file: FileText,
  pen: Pen,
  chat: MessageSquare,
  users: Users,
  edit: Edit,
  party: PartyPopper,
  bell: Bell,
  check: Check,
  alert: AlertTriangle,
  memo: FileText
};

export function IconRenderer({ icon, className, ...props }: IconRendererProps) {
  const IconComponent = iconMap[icon?.toLowerCase() || ''];
  
  if (IconComponent) {
    return <IconComponent className={className} {...props} />;
  }

  // Fallback for emojis
  if (icon && icon.length <= 4) {
    return <span className={className}>{icon}</span>;
  }

  return <FileText className={className} {...props} />;
}
