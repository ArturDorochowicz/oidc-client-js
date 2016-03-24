import Log from '../src/Log';
import UserInfoService from '../src/UserInfoService';

import StubJsonService from './StubJsonService';
import StubMetadataService from './StubMetadataService';

import chai from 'chai';
chai.should();
let assert = chai.assert;

describe("UserInfoService", function() {
    let subject;
    let settings;
    let stubJsonService;
    let stubMetadataService;

    beforeEach(function() {
        settings = {};
        stubJsonService = new StubJsonService();
        stubMetadataService = new StubMetadataService();
        subject = new UserInfoService(settings, () => stubJsonService, () => stubMetadataService);
    });

    describe("constructor", function() {

        it("should require a settings param", function() {
            try {
                new UserInfoService();
            }
            catch (e) {
                return;
            }
            assert.fail();
        });

    });

    describe("getClaims", function() {

        it("should return a promise", function() {
            subject.getClaims().should.be.instanceof(Promise);
        });

        it("should require a token", function(done) {
            subject.getClaims().then(null,
                err => {
                    err.message.should.contain("token");
                    done();
                });
        });

        it("should call userinfo url and pass token", function(done) {
            stubMetadataService.userInfoUrlResult = Promise.resolve("http://sts/userinfo");
            stubJsonService.result = Promise.resolve("test");

            subject.getClaims("token").then(claims => {
                stubJsonService.url.should.equal("http://sts/userinfo");
                stubJsonService.token.should.equal("token");
                done();
            });

        });

        it("should fail when dependencies fail", function(done) {
            stubMetadataService.userInfoUrlResult = Promise.reject("test");

            subject.getClaims("token").then(null,
                err => {
                    err.message.should.contain('claims');
                    done();
                }
            );

        });

        it("should return claims", function(done) {
            stubMetadataService.userInfoUrlResult = Promise.resolve("http://sts/userinfo");
            stubJsonService.result = Promise.resolve({
                foo: 1, bar: 'test',
                aud:'some_aud', iss:'issuer', 
                sub:'123', email:'foo@gmail.com',
                role:['admin', 'dev'],
                nonce:'nonce', at_hash:"athash", 
                iat:5, nbf:10, exp:20
            });

            subject.getClaims("token").then(claims => {
                claims.should.deep.equal({
                    foo: 1, bar: 'test',
                    aud:'some_aud', iss:'issuer', 
                    sub:'123', email:'foo@gmail.com',
                    role:['admin', 'dev'],
                    nonce:'nonce', at_hash:"athash", 
                    iat:5, nbf:10, exp:20
                });
                done();
            });

        });
        
        it("should filter protocol claims", function(done) {
            stubMetadataService.userInfoUrlResult = Promise.resolve("http://sts/userinfo");
            stubJsonService.result = Promise.resolve({
                foo: 1, bar: 'test',
                aud:'some_aud', iss:'issuer', 
                sub:'123', email:'foo@gmail.com',
                role:['admin', 'dev'],
                nonce:'nonce', at_hash:"athash", 
                iat:5, nbf:10, exp:20
            });
            settings.filterProtocolClaims = true;

            subject.getClaims("token").then(claims => {
                claims.should.deep.equal({
                    foo: 1, bar: 'test',
                    sub:'123', email:'foo@gmail.com',
                    role:['admin', 'dev']
                });
                done();
            });

        });

    });
});
