/**
 *
 * 手榴弹
 *
 */
class GrenadeBullet extends HeroBullet{
    /** 1:飞行状态 2:爆炸状态 3:停滞 4:消失*/
    private state: number;
    private targetX: number;
    private targetY: number;
    private flyTime: number;
    private releaseTime: number;
    private stayTime: number;
    private displayTime: number;
    private rotationChange: number;
    
    private bombImg: egret.Bitmap;
    
    public constructor($controller: BaseController) {
        super($controller);
    }
    
    public init(id: number,creater: Hero,moveData: MoveData): void {
        super.init(id , creater, moveData);
        super.setImg(this.bulletData.img);
        this.width = this.bulletData.width;
        this.height = this.bulletData.height;
        
        var info = this.bulletData.info;
        this.releaseTime = info.releaseTime;
        this.stayTime = info.stayTime;
        this.displayTime = info.displayTime;
        this.setBombImg(info.bombImg);
        this.bombImg.visible = false;
        
        this.targetX = this.gameController.GetPerX(0.5 + 0.3 * this.scaleX);
        this.targetY = null;
        this.state = 1;
        this.img.visible =true;
    }
    
    private setBombImg(img) {
        if(this.bombImg == null) {
            this.bombImg = new egret.Bitmap;
            this.addChild(this.bombImg);
        }
        this.bombImg.texture = RES.getRes(img);
        this.bombImg.x = this.bulletData.width / 2;
        this.bombImg.y = this.bulletData.height / 2;
        this.bombImg.anchorOffsetX = this.bombImg.width / 2;
        this.bombImg.anchorOffsetY = this.bombImg.height / 2;
    }
    
    public update(time: number) {
        if(this.targetY == null) {
            this.targetY = this.y;
            this.flyTime = Math.abs(this.targetX - this.x) / this.speed;
            this.rotationChange = -this.rotation * 2 / this.flyTime;
        } 

        this.speed /= Math.cos(this.rotation / 180 * Math.PI);

        super.update(time);
        var t = time / 1000;
        switch(this.state){
            case 1: 
                this.flyTime -= t;
                if(this.flyTime <= 0) {
                    this.bomb();
                } else {
                    this.rotation += t * this.rotationChange;
                    this.speed = this.bulletData.speed;
                }
                break;
            case 2:
                this.bombImg.scaleX = this.bombImg.scaleY += t * (0.8 / this.releaseTime);
                if(this.bombImg.scaleX >= 1){
                    this.state = 3;
                }
                break;
            case 3:
                this.stayTime -= t;
                if(this.stayTime <= 0){
                    this.state = 4;
                }
                break;
            case 4: 
                this.bombImg.scaleX = this.bombImg.scaleY -= t * (0.5 / this.displayTime);
                if(this.bombImg.scaleX <= 0.5){
                    this.remove();
                }
                break;
        }              
    }  
    
    private bomb(){
        this.speed = 0;
        this.state = 2;
        this.img.visible = false;
        this.bombImg.visible = true;
        this.bombImg.scaleX = this.bombImg.scaleY = 0.2;
    }

    protected hitUnit(units: Array<Unit>) {
        super.hitUnit(units);

        if(this.state == 1) {
            this.bomb();
        } else {
            for(var i = 0;i < units.length;i++) {
                this.ignoreUnits.push(units[i]);
            }
        } 
    }

    protected hitItems(items: Array<Item>) {
        super.hitItems(items);
        if(this.state == 1){
            this.bomb();
        }
    }

    protected outScreen() {
        if(this.state != 1){
            super.outScreen();
        }
    }
    
    protected get damage(): number {
        if(this.state == 1){
            return 0;
        }
        return this.bulletData.damage;
    }
    
    public get rect(): Rect {
        var width: number;
        var height: number;
        if(this.state == 1){
            width = this.width;
            height = this.height;
        }else{
            width = this.bombImg.width * this.bombImg.scaleX;
            height = this.bombImg.height * this.bombImg.scaleY;
        }
        return new Rect(this.x, this.y, width, height, this.rotation);
    }
}
