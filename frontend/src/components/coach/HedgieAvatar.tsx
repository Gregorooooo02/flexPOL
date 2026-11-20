import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { hedgieImage } from './hedgie';
import type { HedgieMood } from './hedgie';

/** Hedgie's face in a round avatar. Decorative: the name is shown next to it. */
export function HedgieAvatar({ mood }: { readonly mood: HedgieMood }) {
  return (
    <Avatar size="lg">
      <AvatarImage src={hedgieImage(mood)} alt="" />
      <AvatarFallback>H</AvatarFallback>
    </Avatar>
  );
}
