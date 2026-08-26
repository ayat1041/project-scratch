import HeroSection from './HeroSection';
import StatsBar from './StatsBar';
import FeatureGrid from './FeatureGrid';
import ArchitectureSection from './ArchitectureSection';
import LayerStackSection from './LayerStackSection';
import TerminalSection from './TerminalSection';
import TechStackSection from './TechStackSection';
import FinalCtaSection from './FinalCtaSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeatureGrid />
      <ArchitectureSection />
      <LayerStackSection />
      <TerminalSection />
      <TechStackSection />
      <FinalCtaSection />
    </>
  );
}
