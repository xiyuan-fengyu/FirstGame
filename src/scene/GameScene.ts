import DisplayObject = egret.DisplayObject;
import EgretArmatureDisplay = dragonBones.EgretArmatureDisplay;
/**
 * Created by xiyuan_fengyu on 2017/3/27.
 */
class GameScene extends egret.DisplayObjectContainer {

    private world: p2.World;

    private factor: number = 50;

    private lastTimestamp: number = 0;

    private dragonBonesFactory = new dragonBones.EgretFactory();

    $onAddToStage(stage: egret.Stage, nestLevel: number): void {
        super.$onAddToStage(stage, nestLevel);

        this.world = new p2.World();
        this.world.sleepMode = p2.World.BODY_SLEEPING;


        //创建一个地板
        this.createRect(this.stage.stageWidth, 50, this.stage.stageWidth / 2, this.stage.stageHeight - 25, 0);

        // this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouch, this);

        //通过DragonBones动画创建spirt
        let bird = this.createSpirtByName("bird", {
            width: 64,
            height: 60
        }, 600, 100, 1);
        bird.displays[0]["animation"].play("fly_forw", 0);

        egret.startTick(this.onUpdate, this);
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
        this.world.step(delta / 1000);

        this.world.bodies.forEach(body => {
            body.displays.forEach(display => {
                display.x = body.position[0] * this.factor;
                display.y = this.stage.stageHeight - body.position[1] * this.factor;
                display.rotation = 360 - body.angle * 180 / Math.PI;
            });
        });

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
        obj.graphics.beginFill(0xffffff);
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
        obj.graphics.beginFill(0xffffff);
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

    private createSpirtByName(name: string, bodyShapeConfig: any, x: number, y: number, mass): p2.Body {
        let boneJson = RES.getRes(name + "_json");
        let textureJson = RES.getRes(name + "_texture_json");
        let texture = RES.getRes(name + "_texture_png");

        this.dragonBonesFactory.parseDragonBonesData(boneJson);
        this.dragonBonesFactory.parseTextureAtlasData(textureJson, texture);

        let display = this.dragonBonesFactory.buildArmatureDisplay(boneJson.armature[0].name);
        display.x = x;
        display.y = y;
        this.addChild(display);

        let rigidbody = new p2.Body({
            mass: mass,
            position: [x / this.factor, (this.stage.stageHeight - y) / this.factor]
        });
        let bodyShape;
        if (bodyShapeConfig) {
            if (bodyShapeConfig.width && bodyShapeConfig.height) {
                bodyShape = new p2.Box({
                    width: bodyShapeConfig.width / this.factor,
                    height: bodyShapeConfig.height / this.factor,
                });
            }
            else if (bodyShapeConfig.radius) {
                bodyShape = new p2.Circle();
                bodyShape.radius = bodyShapeConfig.radius;
            }
            rigidbody.addShape(bodyShape);
            rigidbody.displays = [display];
        }

        this.addChild(display);
        this.world.addBody(rigidbody);

        return rigidbody;
    }

}