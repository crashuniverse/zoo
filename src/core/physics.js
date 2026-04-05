import RAPIER from '@dimforge/rapier3d-compat';

let world;

export function createPhysicsWorld() {
  const gravity = { x: 0, y: -9.81, z: 0 };
  world = new RAPIER.World(gravity);
  return world;
}

export function stepPhysics(delta) {
  if (world) {
    world.step();
  }
}

export function getWorld() {
  return world;
}

/** Create a static box collider (for ground, walls, enclosures) */
export function addStaticBox(world, hx, hy, hz, px, py, pz) {
  const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(px, py, pz);
  const body = world.createRigidBody(bodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(hx, hy, hz);
  world.createCollider(colliderDesc, body);
  return body;
}
