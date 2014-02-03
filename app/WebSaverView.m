//
//  WebSaverView.m
//  WebSaver
//
//  Created by Thomas Robinson on 10/13/09.
//  Modified by Pekka Nikander in May 2012.
//  Copyright (c) 2013, Thomas Robinson. All rights reserved.
//  Copyright (c) 2012, Senseg.  All rights reserved.
//

#import "WebSaverView.h"

#import <WebKit/WebKit.h>

#define REFRESH_DISABLED 0
#define REFRESH_SECONDS 1
#define REFRESH_MINUTES 2
#define REFRESH_HOURS 3

@implementation WebSaverView

static NSString * const ModuleName = @"se.possan.StarSaver";

static NSString * const UP_VECTOR_KEY = @"Up";
static NSString * const FORWARD_VECTOR_KEY = @"Forward";
static NSString * const VIEW_OFFSET_KEY = @"ViewOffset";

static NSString * const DEFAULT_UP_VECTOR = @"0,1,0";
static NSString * const DEFAULT_FORWARD_VECTOR = @"0,0,1";
static NSString * const DEFAULT_VIEW_OFFSET = @"0,0,0";

- (id)initWithFrame:(NSRect)frame isPreview:(BOOL)isPreview
{
    self = [super initWithFrame:frame isPreview:isPreview];
    if (self) {
		defaults = [ScreenSaverDefaults defaultsForModuleWithName:ModuleName];

		[defaults registerDefaults:[NSDictionary dictionaryWithObjectsAndKeys:
                                    DEFAULT_FORWARD_VECTOR, FORWARD_VECTOR_KEY,
                                    DEFAULT_UP_VECTOR, UP_VECTOR_KEY,
                                    DEFAULT_VIEW_OFFSET, VIEW_OFFSET_KEY,
									nil]];

		webView = [[WebView alloc] initWithFrame:[self bounds] frameName:nil groupName:nil];
        [webView setDrawsBackground:NO];
        [webView setFrameLoadDelegate:self];

        WebPreferences *p = [webView preferences];
        if ([p respondsToSelector:@selector(setWebGLEnabled:)]) {
            [p setWebGLEnabled:YES];
        }
        [webView setPreferences:p];

		[self addSubview:webView];
        [self loadWebView];

    }
    return self;
}

- (BOOL)hasConfigureSheet
{
	return YES;
}

- (NSWindow *)configureSheet
{
	if (!configSheet)
	{
		if (![NSBundle loadNibNamed:@"ConfigureSheet" owner:self])
		{
			NSLog( @"Failed to load configure sheet." );
			NSBeep();
		}
	}
    
    [upVectorField setStringValue:[defaults valueForKey:UP_VECTOR_KEY]];
    [forwardVectorField setStringValue:[defaults valueForKey:FORWARD_VECTOR_KEY]];
    [viewOffsetField setStringValue:[defaults valueForKey:VIEW_OFFSET_KEY]];

	return configSheet;
}

- (void)loadWebView
{
    NSString *path = [[NSBundle bundleForClass:[self class]] pathForResource:@"index" ofType:@"html"];
    NSLog(@"path=%@", path);
    NSURL *purl = [NSURL fileURLWithPath:path];
    NSString *purl2 = [purl absoluteString];
    NSLog(@"purl2=%@", purl2);
    [webView setMainFrameURL:purl2];
}

- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame
{
    // call view configuration api
    
    NSString *upVectorString = [defaults valueForKey: UP_VECTOR_KEY];
    NSString *forwardVectorString = [defaults valueForKey: FORWARD_VECTOR_KEY];
    NSString *viewOffsetString = [defaults valueForKey: VIEW_OFFSET_KEY];

    /*
     window.starfield.appOverride({
     viewoffset: '0,1,2',
     upvector: '0,1,0',
     forwardvector: '0,0,1'
     });
    */

    NSString *script = [NSString stringWithFormat:
                        @"window.starfield.appOverride( { viewoffset: '%@', upvector: '%@', forwardvector: '%@' });\n", viewOffsetString, upVectorString, forwardVectorString];
   
    
    [sender stringByEvaluatingJavaScriptFromString:script];
}

// IBActions

- (IBAction) okClick:(id)sender
{
	[defaults setValue:[upVectorField stringValue] forKey:UP_VECTOR_KEY];
	[defaults setValue:[forwardVectorField stringValue] forKey:FORWARD_VECTOR_KEY];
	[defaults setValue:[viewOffsetField stringValue] forKey:VIEW_OFFSET_KEY];
	[defaults synchronize];
	[[NSApplication sharedApplication] endSheet:configSheet];
    [self loadWebView];
}

- (IBAction)cancelClick:(id)sender
{
	[[NSApplication sharedApplication] endSheet:configSheet];
}

- (IBAction)close:(id)sender
{
	[[NSApplication sharedApplication] endSheet:configSheet];
}

@end
