interface HeadingProps {
  id?: string;
  title: string;
  description: string;
}

export const Heading: React.FC<HeadingProps> = ({ id, title, description }) => {
  return (
    <div id={id}>
      <h2 className="mb-2 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};
