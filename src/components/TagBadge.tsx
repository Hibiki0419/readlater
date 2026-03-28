type Tag = { id: number; name: string; color: string };

export default function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs text-white"
      style={{ backgroundColor: tag.color }}
    >
      {tag.name}
    </span>
  );
}
