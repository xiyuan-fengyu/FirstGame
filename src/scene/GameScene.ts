import Bitmap = egret.Bitmap;
/**
 * Created by xiyuan_fengyu on 2017/3/27.
 */
class GameScene extends egret.DisplayObjectContainer {

    private world: p2.World;

    private factor: number = 50;

    private lastTimestamp: number = 0;

    private dragonBonesFactory = new dragonBones.EgretFactory();

    private player: p2.Body;

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
        this.createRect(bg.width, 50, this.stage.stageWidth / 2, this.stage.stageHeight - 25, 0);

        // this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouch, this);

        this.initPlayer();

        egret.startTick(this.onUpdate, this);
    }

    private initPlayer() {
        //通过DragonBones动画创建spirt
        this.player = this.createSpirtByName("bird", {
            slot: "body"
        }, this.stage.stageWidth / 4, this.stage.stageWidth / 2, 1);
        this.player.displays[0]["animation"].play("fly", 0);

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
            this.createRect(100, 40, event.stageX, event.stageY, 1);
        }
        else {
            this.createCircle(50, event.stageX, event.stageY, 1);
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
                display.x = body.position[0] * this.factor - (body["offsetX"] || 0);
                display.y = this.stage.stageHeight - body.position[1] * this.factor - (body["offsetY"] || 0);
                display.rotation = 360 - body.angle * 180 / Math.PI;
            });
        });

        this.x -= this.player.displays[0].x - oldX;

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
        obj.graphics.beginFill(0xffffff, 0);
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
        obj.graphics.beginFill(0xffffff, 0);
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

    private createSpirtByName(name: string, bodyConfig: any, x: number, y: number, mass): p2.Body {
        let boneJson = RES.getRes(name + "_ske_json");
        let textureJson = RES.getRes(name + "_tex_json");
        let texture = RES.getRes(name + "_tex_png");

        this.dragonBonesFactory.parseDragonBonesData(boneJson);
        this.dragonBonesFactory.parseTextureAtlasData(textureJson, texture);

        let display = this.dragonBonesFactory.buildArmatureDisplay(boneJson.armature[0].name);
        display.x = x;
        display.y = y;
        this.addChild(display);

        let rigidbody = new p2.Body({
            mass: mass
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

        rigidbody["offsetX"] = bodyConfig.offsetX;
        rigidbody["offsetY"] = bodyConfig.offsetY;
        rigidbody.position = [(x + bodyConfig.offsetX) / this.factor, (this.stage.stageHeight - y - bodyConfig.offsetY) / this.factor];

        this.addChild(display);
        this.world.addBody(rigidbody);

        return rigidbody;
    }

}