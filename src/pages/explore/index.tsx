import { Explore } from '@/components/Explore/Explore';
import { PreviewActionProvider } from '@/contexts/FlowEditorPreviewContext';

export default function ExplorePage() {
  return (
    <PreviewActionProvider>
      <Explore />
    </PreviewActionProvider>
  );
}
