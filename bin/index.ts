#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { ArmadaDynamoStack } from '../lib'

const app = new cdk.App()
new ArmadaDynamoStack(app, 'ArmadaDynamo')
