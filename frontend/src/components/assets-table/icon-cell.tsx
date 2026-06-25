import {
  ChartLine,
  LineDotRightHorizontal,
  LandPlot,
  Building2,
  Map,
  Wrench,
  Layers,
  Box,
} from "lucide-react";
import { ICONS } from "../../api/use-icons";

type IconKey = keyof typeof ICONS;
type Props = { icon: IconKey; size?: number };

export const isIconKey = (value: string): value is IconKey =>
  Object.values(ICONS).includes(value as IconKey);

const DEFAULT_SIZE = 20;

export const IconCell = ({ icon, size = DEFAULT_SIZE }: Props) => {
  let iconElement: React.ReactNode;

  switch (icon) {
    case ICONS.sensor:
      iconElement = <ChartLine size={size} />;
      break;
    case ICONS.site:
      iconElement = <LandPlot size={size} />;
      break;
    case ICONS.line:
      iconElement = <LineDotRightHorizontal size={size} />;
      break;
    case ICONS.enterprise:
      iconElement = <Building2 size={size} />;
      break;
    case ICONS.area:
      iconElement = <Map size={size} />;
      break;
    case ICONS.equipment:
      iconElement = <Wrench size={size} />;
      break;
    case ICONS.subassembly:
      iconElement = <Layers size={size} />;
      break;
    case ICONS.component:
      iconElement = <Box size={size} />;
      break;
    default: {
      const _exhaustive: never = icon;
      return _exhaustive;
    }
  }

  return (
    <span title={icon} style={{ display: "inline-flex" }}>
      {iconElement}
    </span>
  );
};
