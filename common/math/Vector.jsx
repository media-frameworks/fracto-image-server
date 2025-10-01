export class Point3d {

    x: 0;
    y: 0;
    z: 0;

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static difference(point1, point2) {
        const x = point1.x - point2.x;
        const y = point1.y - point2.y;
        const z = point1.z - point2.z;
        return new Point3d(x, y, z)
    }

    static sum(point1, point2) {
        const x = point1.x + point2.x;
        const y = point1.y + point2.y;
        const z = point1.z + point2.z;
        return new Point3d(x, y, z)
    }

    static magnitude(point) {
        const x = point.x;
        const y = point.y;
        const z = point.z;
        return Math.sqrt(x * x + y * y + z * z);
    }

    static nullPoint() {
        return new Point3d(0, 0, 0)
    }

    static identicalPoint(point1, point2) {
        if (point1.x !== point2.x) {
            return false;
        }
        if (point1.y !== point2.y) {
            return false;
        }
        if (point1.z !== point2.z) {
            return false;
        }
        return true;
    }
}

export class Vector3d {

    location: null;
    direction: null;

    constructor(
        location = Point3d.nullPoint(),
        direction = Point3d.nullPoint()) {
        this.location = location;
        this.direction = direction;
    }

    static nullVector() {
        return new Vector3d(Point3d.nullPoint(), Point3d.nullPoint())
    }

    static scale(vector, amount) {
        return new Vector3d(vector.location, new Point3d(
            vector.direction.x * amount,
            vector.direction.y * amount,
            vector.direction.z * amount
        ))
    }

    static crossProduct(vector1, vector2) {
        const a = vector1.direction;
        const b = vector2.direction;
        const cp = new Point3d(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        )
        return new Vector3d(vector1.location, cp);
    }

    static normalize(vector) {
        const magnitude = Point3d.magnitude(vector.direction);
        if (!magnitude) {
            return Vector3d.nullVector();
        }
        return new Vector3d(
            vector.location,
            new Point3d(
                vector.direction.x / magnitude,
                vector.direction.y / magnitude,
                vector.direction.z / magnitude
            ));
    }

    static sum(vector1, vector2) {
        const a = vector1.direction;
        const b = vector2.direction;
        const sum = Point3d.sum(a, b)
        return new Vector3d(vector1.location, sum);
    }
}
