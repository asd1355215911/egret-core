/**
 * Copyright (c) 2014,Egret-Labs.org
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Egret-Labs.org nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EGRET-LABS.ORG AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EGRET-LABS.ORG AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


module egret {
    /**
	 * @classdesc
	 * @class egret.BitmapText
     * 位图字体采用了Bitmap+SpriteSheet的方式来渲染文字。
	 * @extends egret.DisplayObject
     */
    export class BitmapText extends DisplayObject{

        public constructor() {
            super();
        }

        /**
         * 设置文本
         */
        private _text:string = "";
        private _textChanged:boolean = false;
        /**
         * 显示的文本内容
         * @member {string} egret.BitmapText#text
         */
        public get text():string {
            return this._text;
        }
        public set text(value:string) {
            this._textChanged = true;
            this._text = value;

            this._setSizeDirty();
        }

        private _spriteSheet: BitmapTextSpriteSheet = null;
        private _spriteSheetChanged: boolean = false;
        /**
         * BitmapTextSpriteSheet对象，缓存了所有文本的位图纹理
         * @member {egret.BitmapTextSpriteSheet} egret.BitmapText#spriteSheet
         */
        public get spriteSheet(): BitmapTextSpriteSheet { 
            return this._spriteSheet;
        }

        public set spriteSheet(val: BitmapTextSpriteSheet) { 
            if (this._spriteSheet == val)
                return;
            this._spriteSheet = val;
            this._spriteSheetChanged = true;
            this._setSizeDirty();
        }

        public _setSizeDirty():void {
            super._setSizeDirty();
            this.textLinesChange = true;
        }

        public _render(renderContext:RendererContext):void {
            var textLines:Array<string> = this.getTextLines();
            var length:number = textLines.length;
            if(length==0){
                return;
            }
            var bitmapFont:SpriteSheet = this._spriteSheet;
            var yPos:number = 0;
            var maxHeight:number = this._hasHeightSet?this._explicitHeight:Number.POSITIVE_INFINITY;
            var lineHeights:Array<number> = this._lineHeights;
            for(var i:number=0;i<length;i++){
                var lineHeight:number = lineHeights[i];
                if(i>0&&yPos+lineHeight>maxHeight){
                    break;
                }
                var line:string = textLines[i];
                var len:number = line.length;
                var xPos:number = 0;
                for(var j:number=0;j<len;j++){
                    var character = line.charAt(j);
                    var texture = bitmapFont.getTexture(character);
                    if (!texture) {
                        egret.Logger.warning("BitmapText找不到文字所对应的纹理：\"" + character+"\"");
                        continue;
                    }
                    var bitmapWidth:number = texture._bitmapWidth||texture._textureWidth;
                    var bitmapHeight:number = texture._bitmapHeight||texture._textureHeight;
                    this._texture_to_render = texture;
                    RenderFilter.getInstance().drawImage(renderContext, this, texture._bitmapX, texture._bitmapY,
                        bitmapWidth, bitmapHeight, xPos+texture._offsetX, yPos+texture._offsetY, bitmapWidth,bitmapHeight);
                    xPos += texture._textureWidth;
                }
                yPos += lineHeight;
            }
            this._texture_to_render = null;
        }

        public _measureBounds():egret.Rectangle {
            var lines:Array<string> = this.getTextLines();
            if (lines.length==0) {
                return Rectangle.identity.initialize(0, 0, 0, 0);
            }
            return Rectangle.identity.initialize(0, 0, this._textWidth, this._textHeight);
        }

        private _textWidth:number = 0;
        private _textHeight:number = 0;

        private textLinesChange:boolean = true;
        private _textLines:Array<string>;
        private _lineHeights:Array<number> = [];

        private getTextLines():Array<string> {
            if(!this.textLinesChange){
                return this._textLines;
            }
            var textLines:Array<string> = [];
            this._textLines = textLines;
            this.textLinesChange = false;
            var lineHeights:Array<number> = [];
            this._lineHeights = lineHeights;
            if(!this._text||!this._spriteSheet){
                return textLines;
            }
            var textWidth:number = 0;
            var textHeight:number = 0;
            var hasWidthSet:boolean = this._hasWidthSet;
            var maxWidth:number = this._hasWidthSet?this._explicitWidth:Number.POSITIVE_INFINITY;
            var bitmapFont:SpriteSheet = this._spriteSheet;
            var text:string = this._text;
            var textArr:Array<string> = text.split(/(?:\r\n|\r|\n)/);
            var length:number = textArr.length;
            for (var i = 0; i < length; i++) {
                var line:string = textArr[i];
                var len = line.length;
                var lineHeight:number = 0;
                var xPos:number = 0;
                for(var j=0;j<len;j++){
                    var character = line.charAt(j);
                    var texture = bitmapFont.getTexture(character);
                    if (!texture) {
                        egret.Logger.warning("BitmapText找不到文字所对应的纹理：\"" + character+"\"");
                        continue;
                    }
                    var characterWidth = texture._textureWidth;
                    if(hasWidthSet&&j>0&&xPos+characterWidth>maxWidth){
                        textLines.push(line.substring(0,j));
                        lineHeights.push(lineHeight);
                        textHeight += lineHeight;
                        textWidth = Math.max(xPos,textWidth);
                        line = line.substring(j);
                        len = line.length;
                        j=0;
                        xPos = characterWidth;
                        lineHeight = texture._textureHeight;
                        continue;
                    }
                    xPos += characterWidth;
                    lineHeight = Math.max(texture._textureHeight,lineHeight);
                }
                textLines.push(line);
                lineHeights.push(lineHeight);
                textHeight += lineHeight;
                textWidth = Math.max(xPos,textWidth);
            }
            this._textWidth = textWidth;
            this._textHeight = textHeight;
            return textLines;
        }
    }
}
