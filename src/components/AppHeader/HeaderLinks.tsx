import Link from 'next/link';
import SwapIcon from 'src/icons/SwapIcon';
import RepoLogo from 'src/icons/RepoLogo';
import DiscordIcon from 'src/icons/DiscordIcon';
import { cn } from 'src/misc/cn';

const HeaderLink = ({
  href,
  isActive,
  title,
  icon,
  className,
  external = false,
}: {
  href: string;
  isActive: boolean;
  title: string | React.ReactNode;
  icon: React.ReactNode;
  className?: string;
  external?: boolean;
}) => {
  return (
    <Link
      href={href}
      shallow
      className={cn(
        'flex items-center font-semibold text-white/50 hover:text-white fill-current h-[60px] px-4',
        {
          'bg-v3-bg !text-v3-primary': isActive,
        },
        className,
      )}
      {...(external
        ? {
            target: '_blank',
            rel: 'noopener noreferrer',
          }
        : {})}
    >
      <span className="w-5">{icon}</span>
      <span className="ml-2 whitespace-nowrap">{title}</span>
    </Link>
  );
};

const HeaderLinks = () => {
  return (
    <div className="flex-1 justify-center hidden md:!flex text-sm h-full">
      <HeaderLink href="/" isActive title={'Demo'} icon={<SwapIcon width="20" height="20" />} />
      <HeaderLink
        href="https://myweb3apps.com"
        isActive={false}
        external
        title={'Repo'}
        icon={<RepoLogo width="20" height="20" />}
      />
      <HeaderLink
        href="https://myweb3apps.com"
        isActive={false}
        external
        title={'Docs'}
        icon={<RepoLogo width="20" height="20" />}
      />
      <HeaderLink
        href="https://discord.com/invite/jCxDe3BGUU"
        isActive={false}
        external
        title={'Discord'}
        icon={<DiscordIcon width="20" height="20" />}
      />
    </div>
  );
};

export default HeaderLinks;
