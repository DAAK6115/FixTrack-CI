import logo from
  "../assets/fixtrack-ci-logo.png";


type BrandLogoProps = {
  className?: string;
  alt?: string;
};


export default function BrandLogo({
  className = "",
  alt = "FixTrack CI",
}: BrandLogoProps) {
  const classes = [
    "fixtrack-brand-logo",
    className,
  ]
    .filter(
      Boolean
    )
    .join(" ");

  return (
    <img
      className={classes}
      src={logo}
      alt={alt}
      draggable={false}
    />
  );
}
