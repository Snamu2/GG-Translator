document.querySelector('.ufo').addEventListener('click', function() {
  document.getElementById('canvas').style.display = 'block';

  // Set Up the Physics World
  var world = new Box2D.Dynamics.b2World(
    new Box2D.Common.Math.b2Vec2(0, 10),  // gravity
    true                                 // allow sleep
  );

  var SCALE = 30;  // used to scale world coordinates to pixels

  const CANVAS_WIDTH = 800;  // 캔버스 너비
  const CANVAS_HEIGHT = 372; // 캔버스 높이

  // Create the Ground
  var groundBodyDef = new Box2D.Dynamics.b2BodyDef();
  groundBodyDef.position.Set(CANVAS_WIDTH / SCALE, CANVAS_HEIGHT / SCALE);

  var groundBody = world.CreateBody(groundBodyDef);
  var groundShape = new Box2D.Collision.Shapes.b2PolygonShape();
  groundShape.SetAsBox(CANVAS_WIDTH / SCALE, 10 / SCALE);
  groundBody.CreateFixture2(groundShape, 0);

  // Create the Balls
  function createBall(x, y) {
    var ballBodyDef = new Box2D.Dynamics.b2BodyDef();
    ballBodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
    ballBodyDef.position.Set(x / SCALE, y / SCALE);

    var ballBody = world.CreateBody(ballBodyDef);
    var ballShape = new Box2D.Collision.Shapes.b2CircleShape(10 / SCALE);
    ballBody.CreateFixture2(ballShape, 1);

    return ballBody;
  }

  //// Create multiple balls
  for (var i = 0; i < 50; i++) {
    createBall(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT);
  }



  // Create Mouse Variables
  var mouseX, mouseY, mousePressed = false;
  var mouseJoint = null;

  // Add Event Listeners
  document.addEventListener("mousedown", function(e) {
    // console.log("Mouse down event triggered");
    mousePressed = true;
    handleMouseMove(e);
    createMouseJoint();
  });

  document.addEventListener("mouseup", function() {
    // console.log("Mouse up event triggered");
    mousePressed = false;
    destroyMouseJoint();
  });

  document.addEventListener("mousemove", function(e) {
    handleMouseMove(e);
    // console.log("Mouse move event triggered");
  });

  function handleMouseMove(e) {
    var rect = e.target.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / SCALE;
    mouseY = (e.clientY - rect.top) / SCALE;
  }

  // Create and Destroy Mouse Joints
  function createMouseJoint() {
    if (mouseJoint) return;

    var body = getBodyAtMouse();
    // console.log(body)
    if (body) {
        var md = new Box2D.Dynamics.Joints.b2MouseJointDef();
        md.bodyA = world.GetGroundBody();
        md.bodyB = body;
        md.target.Set(mouseX, mouseY);
        md.collideConnected = true;
        md.maxForce = 300.0 * body.GetMass();
        mouseJoint = world.CreateJoint(md);
        body.SetAwake(true);
        // console.log("Mouse joint created");
    }
  }

  function destroyMouseJoint() {
    if (mouseJoint) {
        world.DestroyJoint(mouseJoint);
        mouseJoint = null;
    }
  }

  function getBodyAtMouse() {
    var mousePVec = new Box2D.Common.Math.b2Vec2(mouseX, mouseY);
    var aabb = new Box2D.Collision.b2AABB();
    aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
    aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
    
    var body = null;
    world.QueryAABB(function(fixture) {
        if(fixture.GetBody().GetType() != Box2D.Dynamics.b2Body.b2_staticBody) {
            if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
                body = fixture.GetBody();
                // console.log("Body detected at mouse position");
                return false;
            }
        }
        return true;
    }, aabb);
    return body;
  }



  // Render the Scene
  // Update the Physics Loop
  function update() {
    if (mouseJoint) {
      var mouseVec = new Box2D.Common.Math.b2Vec2(mouseX, mouseY);
      mouseJoint.SetTarget(mouseVec);
    }

    world.Step(1 / 60, 10, 10);
    world.ClearForces();

    // Render balls and ground
    var ctx = document.getElementById('canvas').getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (var body = world.GetBodyList(); body; body = body.GetNext()) {
        if (body.GetType() == Box2D.Dynamics.b2Body.b2_dynamicBody) {
            ctx.beginPath();
            ctx.arc(body.GetPosition().x * SCALE, body.GetPosition().y * SCALE, 10, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            ctx.fillRect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);
        }
    }

    requestAnimationFrame(update);
  }

  update();
});