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
type Props = { icon: IconKey };

export const isIconKey = (value: string): value is IconKey =>
  Object.values(ICONS).includes(value as IconKey);

const ICON_SIZE = 20;

export const IconCell = ({ icon }: Props) => {
  let iconElement: React.ReactNode;

  switch (icon) {
    case ICONS.sensor:
      iconElement = <ChartLine size={ICON_SIZE} />;
      break;
    case ICONS.site:
      iconElement = <LandPlot size={ICON_SIZE} />;
      break;
    case ICONS.line:
      iconElement = <LineDotRightHorizontal size={ICON_SIZE} />;
      break;
    case ICONS.enterprise:
      iconElement = <Building2 size={ICON_SIZE} />;
      break;
    case ICONS.area:
      iconElement = <Map size={ICON_SIZE} />;
      break;
    case ICONS.equipment:
      iconElement = <Wrench size={ICON_SIZE} />;
      break;
    case ICONS.subassembly:
      iconElement = <Layers size={ICON_SIZE} />;
      break;
    case ICONS.component:
      iconElement = <Box size={ICON_SIZE} />;
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
