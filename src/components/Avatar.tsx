type Props = {
  url?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
};

export const Avatar = ({ url, name, email, size = 96, className = "" }: Props) => {
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();
  if (url) {
    return (
      <img
        src={url}
        alt="avatar"
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-gradient-primary grid place-items-center font-bold text-primary-foreground ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
};
