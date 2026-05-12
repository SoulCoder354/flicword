from PIL import Image, ImageDraw
import os
from collections import Counter

root = r"C:\Users\LEGION\Downloads\flicword-main\flicword-main"
logo_source = os.path.join(root, "flicword_logo.png")
public_logo = os.path.join(root, "public", "logo.png")
public_splash = os.path.join(root, "public", "splash.png")
android_splash = os.path.join(root, "android", "app", "src", "main", "res", "drawable", "splash.png")

# Open the source logo image
img = Image.open(logo_source).convert("RGBA")

# Determine a matching background color from the logo
pixels = [pixel[:3] for pixel in img.getdata() if pixel[3] > 16]
if pixels:
    most_common_color = Counter(pixels).most_common(1)[0][0]
    def lighten(color, factor=1.35):
        return tuple(min(int(c * factor), 255) for c in color)
    background_color = (*lighten(most_common_color), 255)
else:
    background_color = (55, 95, 86, 255)

# Copy the logo into the public web assets
os.makedirs(os.path.dirname(public_logo), exist_ok=True)
os.makedirs(os.path.dirname(public_splash), exist_ok=True)
img.save(public_logo, "PNG")
print(f"✓ Copied web logo to {public_logo}")

# Generate a splash screen image for web and Android
splash_width = 1080
splash_height = 1920
canvas = Image.new("RGBA", (splash_width, splash_height), background_color)
logo_max_width = int(splash_width * 0.6)
logo_scaled = img.copy().resize(
    (logo_max_width, int(img.height * logo_max_width / img.width)),
    Image.Resampling.LANCZOS,
)

circle_diameter = int(max(logo_scaled.width, logo_scaled.height) * 1.3)
circle = Image.new("RGBA", (circle_diameter, circle_diameter), (255, 255, 255, 220))
draw = ImageDraw.Draw(circle)
draw.ellipse((0, 0, circle_diameter, circle_diameter), fill=(255, 255, 255, 220))

logo_position = (
    (splash_width - logo_scaled.width) // 2,
    (splash_height - logo_scaled.height) // 2,
)
circle_position = (
    (splash_width - circle_diameter) // 2,
    (splash_height - circle_diameter) // 2,
)
canvas.alpha_composite(circle, circle_position)
canvas.alpha_composite(logo_scaled, logo_position)
canvas.save(public_splash, "PNG")
canvas.save(android_splash, "PNG")
print(f"✓ Generated splash image at {public_splash} and {android_splash}")

# Build launcher icon outputs for Android adaptive/icon resources
density_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
for density, size in density_sizes.items():
    target_dir = os.path.join(root, "android", "app", "src", "main", "res", density)
    os.makedirs(target_dir, exist_ok=True)

    # Standard launcher icon fallback with full logo sizing
    launcher_path = os.path.join(target_dir, "ic_launcher.png")
    filled = Image.new("RGBA", (size, size), background_color)
    logo_size = int(size * 0.9)
    logo_resized = img.copy().resize(
        (logo_size, int(img.height * logo_size / img.width)),
        Image.Resampling.LANCZOS,
    )
    filled_logo_position = (
        (size - logo_resized.width) // 2,
        (size - logo_resized.height) // 2,
    )
    filled.alpha_composite(logo_resized, filled_logo_position)
    filled.save(launcher_path, "PNG")
    print(f"✓ Created ic_launcher {size}×{size} at {launcher_path}")

    # Adaptive foreground icon with much larger logo area
    foreground = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    circle_diameter = int(size * 0.9)
    circle = Image.new("RGBA", (circle_diameter, circle_diameter), (255, 255, 255, 235))
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, circle_diameter, circle_diameter), fill=(255, 255, 255, 235))
    logo_size = int(size * 0.75)
    logo_resized = img.copy().resize(
        (logo_size, int(img.height * logo_size / img.width)),
        Image.Resampling.LANCZOS,
    )

    circle_position = ((size - circle_diameter) // 2, (size - circle_diameter) // 2)
    logo_position = (
        (size - logo_resized.width) // 2,
        (size - logo_resized.height) // 2,
    )
    foreground.alpha_composite(circle, circle_position)
    foreground.alpha_composite(logo_resized, logo_position)

    foreground_path = os.path.join(target_dir, "ic_launcher_foreground.png")
    foreground.save(foreground_path, "PNG")
    print(f"✓ Created ic_launcher_foreground {size}×{size} at {foreground_path}")

    round_path = os.path.join(target_dir, "ic_launcher_round.png")
    foreground.save(round_path, "PNG")
    print(f"✓ Created ic_launcher_round {size}×{size} at {round_path}")

print("\nAll Android launcher icon resources generated successfully!")
