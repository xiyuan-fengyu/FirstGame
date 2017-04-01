import Bitmap = egret.Bitmap;
/**
 * Created by xiyuan_fengyu on 2017/3/27.
 */
class GameScene extends egret.Sprite {

    private world: p2.World;

    private factor: number = 50;

    private lastTimestamp: number = 0;

    private dragonBonesFactory = new dragonBones.EgretFactory();

    private player: p2.Body;

    private debugDraw: p2DebugDraw;

    private curPath = [];

    $onAddToStage(stage: egret.Stage, nestLevel: number): void {
        super.$onAddToStage(stage, nestLevel);

        this.world = new p2.World();
        this.world.sleepMode = p2.World.BODY_SLEEPING;

        //绘制背景
        let bg = new Bitmap();
        bg.height = this.stage.stageHeight;
        bg.texture = RES.getRes("bg_jpg");
        this.addChild(bg);

        //创建一个地板
        this.createRect(bg.width, 50, bg.width / 2, this.stage.stageHeight - 25, 0);

        this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (event: egret.TouchEvent) => {
            this.curPath = [[event.stageX, event.stageY]];
        }, this);
        this.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, (event: egret.TouchEvent) => {
            this.curPath.push([event.stageX, event.stageY]);
        }, this);
        this.stage.addEventListener(egret.TouchEvent.TOUCH_END, (event: egret.TouchEvent) => {
            if (this.curPath.length < 3) {
                this.curPath = [
                    [-200, 200],
                    [-200, 0],
                    [200, 0],
                    [200, 200],
                    [100, 100]
                ];
                let temp = this.curPath.forEach(node => {
                    node[0] += event.stageX;
                    node[1] += event.stageY;
                });
                setTimeout(function () {
                    console.log(temp);
                }, 3000);
            }
            this.createByPath(this.curPath, null, null, 10);
        }, this);

        this.initPlayer();

        this.debugDraw = new p2DebugDraw(this.world, this);

        egret.startTick(this.onUpdate, this);
    }

    private initPlayer() {
        //通过DragonBones动画创建spirt
        // this.player = this.createSpirtByName("bird", {
        //     slot: "body"
        // }, this.stage.stageWidth / 4, this.stage.stageWidth / 2, 1);
        // this.player.displays[0]["animation"].play("fly", 0);

        this.player = this.createRect(20, 20, 100, 100, 1);

        this.player["key"] = {};
        this.player["update"] = function () {
            var key = this["key"];
            if (key.ArrowLeft) {
                this.force[0] = -15;
                this.displays[0].scaleX = -1;
            }
            else if (key.ArrowRight) {
                this.force[0] = 15;
                this.displays[0].scaleX = 1;
            }
            else {
                this.force[0] = 0;
            }

            if (key.ArrowDown) {
                this.force[1] = -20;
            }
            else if (key.ArrowUp) {
                this.force[1] = 20;
            }
            else {
                this.force[1] = 0;
            }

        };

        KeyEventListener.add(KeyEventType.KEY_DOWN, ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], event => {
            this.player["key"][event.key] = true;
        }, this);
        KeyEventListener.add(KeyEventType.KEY_UP, ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], event => {
            this.player["key"][event.key] = false;
        }, this);
    }

    private onTouch(event: egret.TouchEvent) {
        let random = Math.random();
        if (random < 0.5) {
            this.createRect(100, 40, event.stageX - this.x, event.stageY - this.y, 1);
        }
        else {
            this.createCircle(50, event.stageX - this.x, event.stageY - this.y, 1);
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

        // this.x -= this.player.displays[0].x - oldX;

        this.debugDraw.drawDebug();

        return true;
    }

    private createRect(width: number, height: number, x: number, y: number, mass: number): p2.Body {
        let obj = new egret.Shape();
        obj.width = width;
        obj.height = height;
        obj.anchorOffsetX = obj.width / 2;
        obj.anchorOffsetY = obj.height / 2;
        obj.x = x;
        obj.y = y;
        obj.graphics.beginFill(0xffffff, 0.5);
        obj.graphics.drawRect(0, 0, obj.width, obj.height);
        obj.graphics.endFill();

        let rigidbody = new p2.Body({
            mass: mass,
            position: [obj.x / this.factor, (this.stage.stageHeight - obj.y) / this.factor]
        });
        let bodyShape = new p2.Box({
            width: width / this.factor,
            height: height / this.factor,
        });
        rigidbody.addShape(bodyShape);
        rigidbody.displays = [obj];

        this.addChild(obj);
        this.world.addBody(rigidbody);

        return rigidbody;
    }

    private createCircle(radius: number, x: number, y: number, mass: number): p2.Body {
        let obj = new egret.Shape();
        obj.width = radius * 2;
        obj.height = radius * 2;
        obj.anchorOffsetX = radius;
        obj.anchorOffsetY = radius;
        obj.x = x;
        obj.y = y;
        obj.graphics.beginFill(0xffffff, 0.2);
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

    private createByPath(path, x: number, y: number, mass: number): p2.Body {
        var display = new egret.Shape();
        display.graphics.beginFill(0xffffff);

        let minX = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let minY = Number.MAX_VALUE;
        let maxY = Number.MIN_VALUE;
        let centerX = 0;
        let centerY = 0;
        let len = path.length;
        path.forEach(node => {
            minX = minX <= node[0] ? minX : node[0];
            maxX = maxX >= node[0] ? maxX : node[0];
            minY = minY <= node[1] ? minY : node[1];
            maxY = maxY >= node[1] ? maxY : node[1];
            centerX += node[0];
            centerY += node[1];
        });
        centerX /= len;
        centerY /= len;
        let offsetX = centerX - (minX + maxX) / 2;
        let offsetY = centerY - (minY + maxY) / 2;
        path.forEach(node => {
            node[0] -= minX;
            node[1] -= minY;
        });

        for (let i = 0; i <= len; i++) {
            let node = path[i == len ? 0: i];
            if (i == 0) {
                display.graphics.moveTo(node[0], node[1]);
            }
            else {
                display.graphics.lineTo(node[0], node[1]);
            }
        }

        display.graphics.endFill();

        path.forEach(node => {
            node[0] /= this.factor;
            node[1] = (display.width - node[1]) / this.factor;
        });

        var rigidbody = new p2.Body({
            mass : mass
        });
        rigidbody.fromPolygon(path);
        display.anchorOffsetX = display.width / 2;
        display.anchorOffsetY = display.height / 2;
        display.x = x || centerX;
        display.y = y || centerY;
        rigidbody.position = [display.x / this.factor, (this.stage.stageHeight - display.y) / this.factor];
        rigidbody.displays = [display];
        this.addChild(display);
        this.world.addBody(rigidbody);

        return rigidbody;
    }

    private createSpirtByName(name: string, bodyConfig: any, x: number, y: number, mass): p2.Body {
        let boneJson = RES.getRes(name + "_ske_json");
        let textureJson = RES.getRes(name + "_tex_json");
        let texture = RES.getRes(name + "_tex_png");

        this.dragonBonesFactory.parseDragonBonesData(boneJson);
        this.dragonBonesFactory.parseTextureAtlasData(textureJson, texture);

        let display = this.dragonBonesFactory.buildArmatureDisplay(boneJson.armature[0].name);
        this.addChild(display);

        let rigidbody = new p2.Body({
            mass: mass,
            fixedRotation: true
        });

        let bodyShape;
        bodyConfig.offsetX = bodyConfig.offsetX || 0;
        bodyConfig.offsetY = bodyConfig.offsetY || 0;
        if (bodyConfig) {
            if (bodyConfig.width && bodyConfig.height) {
                bodyShape = new p2.Box({
                    width: bodyConfig.width / this.factor,
                    height: bodyConfig.height / this.factor,
                });
            }
            else if (bodyConfig.radius) {
                bodyShape = new p2.Circle();
                bodyShape.radius = bodyConfig.radius;
            }
            else if (bodyConfig.slot) {
                let slot = display.armature.getSlot(bodyConfig.slot);
                let transform = slot.global;
                let bitmap = slot.display;
                bodyShape = new p2.Box({
                    width: bitmap.width * transform.scaleX / this.factor,
                    height: bitmap.height * transform.scaleY / this.factor,
                });
                bodyConfig.offsetX = transform.x;
                bodyConfig.offsetY = transform.y;
            }

            rigidbody.addShape(bodyShape);
            rigidbody.displays = [display];
        }

        display.anchorOffsetX = display.width / 2 - bodyConfig.offsetX;
        display.anchorOffsetY = display.height / 2 - bodyConfig.offsetY;
        display.x = x;
        display.y = y;
        rigidbody.position = [x / this.factor, (this.stage.stageHeight - y) / this.factor];

        this.addChild(display);
        this.world.addBody(rigidbody);

        return rigidbody;
    }

}