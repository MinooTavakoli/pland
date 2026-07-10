interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Backdrop({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
    />
  );
}
