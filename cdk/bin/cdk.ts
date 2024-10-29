#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WASLayerStack } from '../lib/was-layer-stack';
import { InfraLayerStack } from '../lib/infra-stack' 
import { DBLayerStack } from '../lib/db-layer-stack'

const app = new cdk.App();

const infraLayer = new InfraLayerStack(app, 'InfraLayer', {});
const DBLayer = new DBLayerStack(app, 'DBLayer', {});
const wasLayer = new WASLayerStack(app, 'WASLayer', {});

DBLayer.addDependency(infraLayer)
wasLayer.addDependency(DBLayer)