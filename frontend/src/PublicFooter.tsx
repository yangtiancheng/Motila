import { Typography } from 'antd';

type PublicFooterProps = {
  footerText: string;
};

function renderFooterContent(text: string) {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <a key={`${match[2]}-${match.index}`} href={match[2]} target="_blank" rel="noopener noreferrer">
        {match[1]}
      </a>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length > 0 ? nodes : text;
}

export function PublicFooter({ footerText }: PublicFooterProps) {
  return (
    <footer className="landing-footer landing-footer-plain landing-footer-rich">
      <Typography.Text>{renderFooterContent(footerText)}</Typography.Text>
    </footer>
  );
}
