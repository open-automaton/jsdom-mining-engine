const should = require('chai').should();
const path = require('path');
const Automaton = require('@open-automaton/automaton');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const AutomatonPlaywrightEngine = require('../src/jsdom.js');
const canonical = require(
    '@open-automaton/automaton-engine/test/canonical-tests.js'
)(Automaton, should);

let playwrightEngine = new AutomatonPlaywrightEngine();

describe('strip-mine', function(){
    describe('automaton', function(){
        it('loads a canonical definition', function(done){
            this.timeout(10000);
            canonical.loadDefinition(playwrightEngine, done);
        });

        it('scrapes a static page', function(done){
            this.timeout(10000);
            canonical.staticScrape(playwrightEngine, done);
        });

        it('scrapes a form', function(done){
            this.timeout(10000);
            canonical.formScrape(playwrightEngine, done);
        });

        after(()=>{
            /*setTimeout(()=>{
                process.exit();
            }, 10000);*/
        });
    });
});
