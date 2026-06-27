# Create PNG icons from SVG at various sizes
# Requires: imagemagick (convert) or inkscape

ICONS_DIR="resources/icons"
SIZES="16 24 32 48 64 128 256 512"

if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate icons..."
    for size in $SIZES; do
        convert -background none -resize ${size}x${size} "$ICONS_DIR/icon.svg" "$ICONS_DIR/${size}x${size}.png"
        echo "  Created ${size}x${size}.png"
    done
elif command -v inkscape &> /dev/null; then
    echo "Using Inkscape to generate icons..."
    for size in $SIZES; do
        inkscape "$ICONS_DIR/icon.svg" -w $size -h $size -o "$ICONS_DIR/${size}x${size}.png"
        echo "  Created ${size}x${size}.png"
    done
elif command -v rsvg-convert &> /dev/null; then
    echo "Using librsvg to generate icons..."
    for size in $SIZES; do
        rsvg-convert -w $size -h $size "$ICONS_DIR/icon.svg" -o "$ICONS_DIR/${size}x${size}.png"
        echo "  Created ${size}x${size}.png"
    done
else
    echo "Warning: No SVG converter found (install imagemagick, inkscape, or librsvg)"
    echo "Using placeholder icons..."
    # Create a simple placeholder
    for size in 256 512; do
        touch "$ICONS_DIR/${size}x${size}.png"
    done
fi

echo "Icons generated in $ICONS_DIR/"
