import cv2
import numpy as np

def extract_path(img1_path, img2_path):
    img1 = cv2.imread(img1_path)
    img2 = cv2.imread(img2_path)
    
    if img1 is None or img2 is None:
        print("Error loading images")
        return
        
    diff = cv2.absdiff(img1, img2)
    gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    
    # The trail will have high difference
    _, thresh = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)
    
    # Find coordinates of non-zero pixels
    coords = np.column_stack(np.where(thresh > 0))
    
    if len(coords) == 0:
        print("No difference found")
        return
        
    # We want a path. Let's get the skeleton or just trace it.
    # A simpler way is to find a line through the points. 
    # Let's just output the points in order of Y coordinate (assuming trail goes top to bottom)
    
    # Sort by Y coordinate (which is coords[:, 0] since it's (row, col))
    coords = coords[np.argsort(coords[:, 0])]
    
    # Since the trail has thickness, we can take the average X for each Y
    unique_ys = np.unique(coords[:, 0])
    path_points = []
    
    height, width = gray.shape
    
    for y in unique_ys:
        xs = coords[coords[:, 0] == y][:, 1]
        avg_x = np.mean(xs)
        path_points.append((avg_x / width * 100, y / height * 100)) # Percentages
        
    # Subsample to keep it simple, maybe 20 points
    step = max(1, len(path_points) // 20)
    subsampled = path_points[::step]
    
    if not subsampled:
        return
        
    # Construct SVG path
    svg = f"M {subsampled[0][0]:.2f} {subsampled[0][1]:.2f}"
    
    # Use L for lines instead of C for perfect pixel matching, or we can use bezier
    for x, y in subsampled[1:]:
        svg += f" L {x:.2f} {y:.2f}"
        
    print(svg)

extract_path('e:/Projects/Project Arc/public/bg-original.png', 'e:/Projects/Project Arc/public/bg-trail.png')
