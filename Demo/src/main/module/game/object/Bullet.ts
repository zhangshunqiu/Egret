/**
 *
 * @author 
 *
 */
enum BulletState{
    Shoot,
    Go,
    Return,
    Fall,
    Ready
}

class Bullet extends BaseGameObject{
    
    private id: number;
    private bulletData: BulletData;
    private speed: number;
    private img: egret.Bitmap;
    private moveData: MoveData;
    private creater: Hero;
    private state: BulletState;
    private ignoreHeroes: Array<Hero>;
    
    private sh: egret.Shape;
    private mg: egret.Graphics;
    private mPoints: any[] = [];
    
    public constructor($controller: BaseController) {
        super($controller);
        
    }

    public init(id: number,creater: Hero, moveData: MoveData): void {
        super.init(creater.side);
        this.id = id;
        this.creater = creater;
        if(this.side == Side.Own) {
            this.scaleX = 1;
        } else if(this.side == Side.Enemy) {
            this.scaleX = -1;
        }
        this.moveData = moveData;
        this.rotation = moveData.direction;
        this.bulletData = GameManager.GetBulletData(id);
        this.setImg(this.bulletData.img);
        this.width = this.bulletData.width;
        this.height = this.bulletData.height;
        this.speed = this.bulletData.speed;
        switch(this.bulletData.type) {
            case BulletType.Normal:
                this.state = BulletState.Shoot;
                break;
            case BulletType.Spin:
                this.state = BulletState.Shoot;
                break;
            case BulletType.Boomerang:
                this.state = BulletState.Go;
                break;
            case BulletType.Laser:
                this.state = BulletState.Ready;
                break;
        }
        
        this.ignoreHeroes = [];
        
        if(this.sh == null){
            this.sh  = new egret.Shape();
            this.creater.parent.addChild(this.sh);
            this.mg = this.sh.graphics;
        }
    }
    
    private setImg(img: string){
        if(this.img == null){
            this.img = new egret.Bitmap;
            this.addChild(this.img);
        }
        this.img.rotation = 0;
        this.img.texture = RES.getRes(img);
        this.img.x = this.bulletData.width / 2;
        this.img.y = this.bulletData.height / 2;
        this.img.anchorOffsetX = this.img.width / 2;
        this.img.anchorOffsetY = this.img.height / 2;
    }
    
    public update(time: number) {
        super.update(time);
        
        if(this.bulletData.trail != null){
            this.drawTrail(this.bulletData.trail);
        }
                
        var t = time / 1000;
        this.x += this.speed * t * Math.cos(this.rotation / 180 * Math.PI) * this.scaleX;
        this.y += this.speed * t * Math.sin(this.rotation / 180 * Math.PI) * this.scaleX;        
        
        switch(this.state){
            case BulletState.Shoot:
                break;
            case BulletState.Go:
                this.speed -= time * 0.9;
                if(this.speed <= 700){
                    this.state = BulletState.Return;   
                    this.ignoreHeroes = [];
                }
                break;
            case BulletState.Return:
                this.speed += time * 0.9;
                var r = App.MathUtils.getRadian2(this.x,this.y,this.creater.x,this.creater.y);
                if(this.scaleX == -1){
                    r = App.MathUtils.getRadian2(this.creater.x,this.creater.y,this.x,this.y);
                }
                var a = App.MathUtils.getAngle(r);
                this.rotation = a;
                if(this.rect.intersects(this.creater.rect)){
                    this.remove();
                    this.creater.GunReturn();
                }
                break;
            case BulletState.Fall:
                this.speed += time;
                var targetR = 90;
                var curR = this.rotation;
                if(this.rotation < 0){
                    curR += 360;
                }
                if(this.scaleX == -1){
                    targetR = -90;  
                    if(curR > 180){
                        targetR = 270;
                    }
                }
                if(curR > targetR){
                    this.rotation = Math.max(targetR, curR - time / 5);
                }else{
                    this.rotation = Math.min(targetR, curR + time / 5);
                }
                break;
            case BulletState.Ready:
            
                this.speed = 0;
                break;
        }
        
        var hitHeroes: Array<Hero> = this.gameController.CheckHitHero(this);
        var hitItem: Boolean = this.gameController.CheckHitItem(this);
        var outScreen: Boolean = this.gameController.CheckOutScreen(this);
        switch(this.bulletData.type) {
            case BulletType.Normal:
                if(hitHeroes.length > 0 || hitItem || outScreen){
                    this.remove();
                }
                break;
            case BulletType.Spin:
                this.img.rotation += time;
                if(hitHeroes.length > 0 || hitItem || outScreen) {
                    this.remove();
                }
                break;
            case BulletType.Boomerang:
                this.img.rotation += time;
                if(hitItem){
                    this.state = BulletState.Fall;
                }else if(outScreen){
                    this.remove();                
                }
                if(hitHeroes.length > 0){                    
                    for(var i = 0; i < hitHeroes.length; i++){
                        this.ignoreHeroes.push(hitHeroes[i]);
                    }
                }
                break;
        }
    }  
    
    private remove(){
        App.ControllerManager.applyFunc(ControllerConst.Game,GameConst.RemoveBullet,this);
    }
    
    private drawTrail(color: number){
        var mPenSize = this.height * 0.5;
        var obj = { sx: this.x,sy: this.y,size: mPenSize };
        this.mPoints.push(obj);
        if(this.mPoints.length == 0) return;
        this.mg.clear();
        var _count: number = this.mPoints.length;

        for(var i: number = 0;i < _count;i++) {
            var pt = this.mPoints[i];
            pt.size -= 1;
            if(pt.size < 6) {
                this.mPoints.splice(i,1);
                i--;
                _count = this.mPoints.length;
            }
        }
        _count = this.mPoints.length;

        var alpha = 0.1;
        for(i = 1;i < _count;i++) {
            var p = this.mPoints[i];
            var count = 5;
            var sx = this.mPoints[i - 1].sx;
            var sy = this.mPoints[i - 1].sy;
            var sx1 = p.sx;
            var sy1 = p.sy;
            var size = this.mPoints[i - 1].size;
            var size1 = p.size;
            for(var j = 0;j < count;j++) {
                this.mg.lineStyle(size + (size1 - size) / count * j,color,alpha);
                this.mg.moveTo(sx + (sx1 - sx) / count * j,sy + (sy1 - sy) / count * j);
                this.mg.lineTo(sx + (sx1 - sx) / count * (j + 1),sy + (sy1 - sy) / count * (j + 1));
                alpha += 0.002;
            }
        }
    }
    
    private clearMg(){
        this.mg.clear();
        this.mPoints = [];
    }
    
    public destory(): void {
        super.destory();
        this.clearMg();
    }

    public CheckIgnore(hero: Hero): Boolean{
        return this.ignoreHeroes.indexOf(hero) >= 0;
    }
    
    public GetDamage(): number{
        return this.bulletData.damage;
    }
    
    public GetCreater(): Hero{
        return this.creater;
    }
}