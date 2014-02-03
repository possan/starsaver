//
//  WebSaverView.h
//  WebSaver
//
//  Created by Thomas Robinson on 10/13/09.
//  Modified by Pekka Nikander in May 2012.
//  Copyright (c) 2013, Thomas Robinson. All rights reserved.
//  Copyright (c) 2012, Senseg.  All rights reserved.
//

#import <ScreenSaver/ScreenSaver.h>

#import <WebKit/WebKit.h>

@interface WebSaverView : ScreenSaverView 
{
	IBOutlet id configSheet;
    IBOutlet NSTextField *upVectorField;
	IBOutlet NSTextField *forwardVectorField;
	IBOutlet NSTextField *viewOffsetField;
    ScreenSaverDefaults *defaults;
	WebView *webView;
}

- (void)loadWebView;

@end
