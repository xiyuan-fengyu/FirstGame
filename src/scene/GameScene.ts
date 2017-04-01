import Bitmap = egret.Bitmap;
/**
 * Created by xiyuan_fengyu on 2017/3/27.
 */
class GameScene extends egret.Sprite {

    private world: p2.World;

    private factor: number = 50;

    private lastTimestamp: number = 0;

    private player: p2.Body;

    $onAddToStage(stage: egret.Stage, nestLevel: number): void {
        super.$onAddToStage(stage, nestLevel);

        this.world = new p2.World();
        this.world.sleepMode = p2.World.BODY_SLEEPING;
        this.world.on("beginContact", this.onWorldEvent, this);
        this.world.on("endContact", this.onWorldEvent, this);

        this.initPlayer();

        this.createGround(50, this.stage.stageHeight, -25, this.stage.stageHeight / 2);
        this.createGround(200, 200, 100, this.stage.stageHeight - 100);
        this.createGround(100, 800, 400, this.stage.stageHeight - 100);

        egret.startTick(this.onUpdate, this);
    }

    private initPlayer() {
        this.player = this.createRect("player", 40, 40, 200, 100, 0x4395FF, 1);
        this.player["jumpForce"] = 0;
        this.player["jumping"] = false;
        this.player["key"] = {};
        this.player["update"] = function () {
            var key = this["key"];
            {
                //左右行走
                if (key.a) {
                    this.force[0] = -15;
                    this.displays[0].scaleX = -1;
                }
                else if (key.d) {
                    this.force[0] = 15;
                    this.displays[0].scaleX = 1;
                }
                else {
                    this.force[0] = 0;
                }
            }

            {
                //跳跃
                if (key.k) {
                    this.jumpForce += 100;
                }

                if (!this.jumping && !key.k && this.jumpForce > 0) {
                    this.jumping = true;
                    this.force[1] = Math.min(this.jumpForce, 700);
                    this.jumpForce = 0;
                }
            }

            {
                //冲刺
                if (key.i == false) {
                    this.force[0] = this.displays[0].scaleX * 1000;
                    delete key.i;
                }
            }

        };

        this.player["onEvent"] = function (event, other) {
            // console.log(other.id, other.flag, event.type);
            let type = event.type;
            if (other.flag == "ground-top") {
                if (type == "beginContact") {
                    this.jumping = false;
                    this.jumpForce = 0;
                    this.damping = 0.6;
                }
                else if (type == "endContact") {
                    this.damping = 0;
                }
            }
            else if (other.flag.match("ground-(left|right)")) {
                if (type == "beginContact") {
                    this.jumping = false;
                    this.jumpForce = 0;
                    this.damping = 0.95;
                }
                else if (type == "endContact") {
                    this.damping = 0;
                }
            }

        };

        KeyEventListener.add(KeyEventType.KEY_DOWN, ["a", "d", "k"], event => {
            this.player["key"][event.key] = true;
        }, this);
        KeyEventListener.add(KeyEventType.KEY_UP, ["a", "d", "k", "i"], event => {
            this.player["key"][event.key] = false;
        }, this);
    }

    private onTouch(event: egret.TouchEvent) {
        let random = Math.random();
        if (random < 0.5) {
            this.createRect("test", 100, 40, event.stageX - this.x, event.stageY - this.y);
        }
        else {
            this.createCircle(50, event.stageX - this.x, event.stageY - this.y);
        }
    }

    private onWorldEvent(event) {
        if (event.bodyA.onEvent) {
            event.bodyA.onEvent(event, event.bodyB);
        }

        if (event.bodyB.onEvent) {
            event.bodyB.onEvent(event, event.bodyA);
        }
    }

    private onUpdate(timestamp: number): boolean {
        let delta = this.lastTimestamp == 0 ? 0 : (timestamp - this.lastTimestamp);
        this.lastTimestamp = timestamp;

        let oldX = this.player.displays[0].x;
        this.player["update"]();

        //更新物理世界
        this.world.step(delta / 1000);
        this.world.bodies.forEach(body => {
            body.displays.forEach(display => {
                display.x = body.position[0] * this.factor;
                display.y = this.stage.stageHeight - body.position[1] * this.factor;
                display.rotation = 360 - body.angle * 180 / Math.PI;
            });
        });

        this.x -= this.player.displays[0].x - oldX;

        return true;
    }

    private createRect(flag: string, width: number, height: number, x: number, y: number, color: number = 0xffffff, alpha: number = 1, mass: number = 1): p2.Body {
        let obj = new egret.Shape();
        obj.width = width;
        obj.height = height;
        obj.anchorOffsetX = obj.width / 2;
        obj.anchorOffsetY = obj.height / 2;
        obj.x = x;
        obj.y = y;
        obj.graphics.beginFill(color, alpha);
        obj.graphics.drawRect(0, 0, obj.width, obj.height);
        obj.graphics.endFill();

        let rigidbody = new p2.Body({
            mass: mass,
            position: [obj.x / this.factor, (this.stage.stageHeight - obj.y) / this.factor]
        });
        rigidbody.collisionResponse = true;

        let bodyShape = new p2.Box({
            width: width / this.factor,
            height: height / this.factor,
        });
        rigidbody.addShape(bodyShape);
        rigidbody.displays = [obj];

        this.addChild(obj);
        this.world.addBody(rigidbody);

        rigidbody["flag"] = flag;

        return rigidbody;
    }

    private createCircle(radius: number, x: number, y: number, color: number = 0xffffff, alpha: number = 1, mass: number = 1): p2.Body {
        let obj = new egret.Shape();
        obj.width = radius * 2;
        obj.height = radius * 2;
        obj.anchorOffsetX = radius;
        obj.anchorOffsetY = radius;
        obj.x = x;
        obj.y = y;
        obj.graphics.beginFill(color, alpha);
        obj.graphics.drawCircle(radius, radius, radius);
        obj.graphics.endFill();

        let rigidbody = new p2.Body({
            mass: mass,
            position: [obj.x / this.factor, (this.stage.stageHeight - obj.y) / this.factor]
        });
        let bodyShape = new p2.Circle();
        bodyShape.radius = radius / this.factor;
        rigidbody.addShape(bodyShape);
        rigidbody.displays = [obj];

        this.addChild(obj);
        this.world.addBody(rigidbody);

        return rigidbody;
    }

    private createGround(width: number, height: number, x: number, y: number) {
        let thickness = 20;
        this.createRect("ground-top", width, thickness, x, y - height / 2 + thickness / 2, 0xffffff, 0, 0);
        this.createRect("ground-bottom", width, thickness, x, y + height / 2 - thickness / 2, 0xffffff, 0, 0);
        this.createRect("ground-left", thickness, height - thickness, x - width / 2 + thickness / 2, y, 0xffffff, 0, 0);
        this.createRect("ground-right", thickness, height - thickness, x + width / 2 - thickness / 2, y, 0xffffff, 0, 0);

        let rect = new egret.Shape();
        rect.width = width;
        rect.height = height;
        rect.anchorOffsetX = rect.width / 2;
        rect.anchorOffsetY = rect.height / 2;
        rect.x = x;
        rect.y = y;
        rect.graphics.beginFill(0xffffff, 1);
        rect.graphics.drawRect(0, 0, rect.width, rect.height);
        rect.graphics.endFill();
        this.addChild(rect);
    }

}