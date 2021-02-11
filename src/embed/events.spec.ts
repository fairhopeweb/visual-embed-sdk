import {
    init,
    AuthType,
    EventType,
    SearchEmbed,
    PinboardEmbed,
} from '../index';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getRootEl,
    postMessageToParent,
} from '../test/test-utils';

const thoughtSpotHost = 'tshost';
const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const PAYLOAD = 'Sample payload';
// time to wait for async events to be triggered
const EVENT_WAIT_TIME = 1000;

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

describe('test communication between host app and ThoughtSpot', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should capture event from ThoughtSpot app', (done) => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed
            .on(EventType.CustomAction, (data) => {
                expect(data.data).toBe(PAYLOAD);
                done();
            })
            .render();

        const iframe = getIFrameEl();
        postMessageToParent(iframe.contentWindow, {
            type: EventType.CustomAction,
            data: PAYLOAD,
        });
    });

    test('should trigger event to ThoughtSpot app', (done) => {
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        searchEmbed.render();
        setTimeout(() => {
            searchEmbed.trigger(EventType.CustomAction, {
                body: PAYLOAD,
            });
        }, EVENT_WAIT_TIME);
        const iframe = getIFrameEl();

        iframe.contentWindow.addEventListener('message', (e) => {
            expect(e.data.type).toBe(EventType.CustomAction);
            expect(e.data.data.body).toBe(PAYLOAD);
            done();
        });
    });

    test('should capture event from correct iframe', async () => {
        const spyOne = jest.fn();
        const embedOne = new SearchEmbed(getRootEl(), defaultViewConfig);
        embedOne.on(EventType.CustomAction, spyOne).render();

        const spyTwo = jest.fn();
        const embedTwo = new PinboardEmbed(getRootEl(), defaultViewConfig);
        embedTwo.on(EventType.CustomAction, spyTwo).render({
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        });

        const iframeOne = getIFrameEl();
        postMessageToParent(iframeOne.contentWindow, {
            type: EventType.CustomAction,
            data: PAYLOAD,
        });

        await executeAfterWait(() => {
            expect(spyOne).toHaveBeenCalled();
            expect(spyTwo).not.toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });
});
