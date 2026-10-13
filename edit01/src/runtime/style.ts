import { type IMThemeVariables, css, type SerializedStyles, polished } from 'jimu-core'

export function getStyle (theme: IMThemeVariables, id: string, featureFormStep: 'empty' | 'list' | 'form' | 'new', editCount: number, isAttrMode: boolean): SerializedStyles {
  return css`
    ${'&.edit-widget-' + id} {
      .esri-feature-form__input:focus,
      calcite-input:focus{
        outline: unset !important;
        outline-offset: unset !important;
      }
      .editor-white-bg{
        background-color: ${theme.ref.palette.white};
      }
      [heading='Edit feature'] .esri-editor__panel-content{
        padding: 0;
        .esri-editor__panel-content--section{
          padding: 8px 16px;
        }
      }
      .esri-editor__content{
        padding: 8px 16px;
      }
      .esri-feature-form{
        ${(featureFormStep === 'empty' || featureFormStep === 'list') && `border-bottom: 1px solid ${theme.ref.palette.neutral[300]};`}
        background-color: unset;
        .esri-feature-form__form-header{
          margin: 0;
          .esri-feature-form__description-text{
            font-weight: 500;
            font-size: 13px;
            margin: 0;
          }
        }
      }
      .esri-feature-templates{
        width: 100%;
        height: calc(100% - 40px);
        .esri-item-list{
          height: 100%;
          .esri-item-list__scroller{
            height: 100%;
          }
        }
      }
      .esri-editor__temp-wrapper{
        height: 100%;
      }
      .esri-editor__header{
        min-height: 56px;
        padding-left: ${(!isAttrMode || editCount === 1) ? '15px' : '35px'};
        .esri-widget__heading{
          font-weight: 600;
          font-size: 16px;
          margin: 0 8px;
          text-align: left;
          padding: 1px 0;
          height: 56px;
          line-height: 54px
        }
      }
      .esri-editor__controls{
        border-top: 1px solid rgba(110,110,110,.3);
        padding: 12px 15px;
        display: flex;
        flex-direction: column;
        ${!isAttrMode && 'justify-content: space-between !important; flex-direction: row !important;'}
        .esri-editor__control-button:first-of-type{
          color: ${theme.ref.palette.white};
          background-color: ${theme.sys.color.primary.main};
          border: 1px solid ${theme.sys.color.primary.main};
          :hover{
            background-color: ${theme.sys.color.primary.main};
          }
        }
        .esri-editor__control-button{
          color: ${theme.ref.palette.neutral[1100]};
          background-color: ${theme.ref.palette.white};
          border: 1px solid ${theme.ref.palette.neutral[500]};
          :hover{
            background-color: ${theme.ref.palette.neutral[200]};
          }
        }
        .esri-editor__control-button + .esri-editor__control-button{
          margin-left: 2%;
        }
      }
      .esri-item-list__list-item{
        :focus,
        :focus-visible {
          outline-offset: -2px !important;
        }
      }
      .esri-item-list__list{
        list-style: none;
        margin: 0;
        padding: 0;
        .esri-item-list__list-item{
          cursor: pointer;
          margin-bottom: 6px;
          min-height: 48px;
          transition: border 250ms ease-in-out;
          display: flex;
          justify-content: space-between;
          .esri-item-list__list-item-container{
            display: flex;
            margin: 9px 2px;
            width: 100%;
            .esri-item-list__list-item-label{
              flex: 1;
              margin: 0;
              display: flex;
              align-items: center;
              word-break: break-word;
              padding-left: 20px;
            }
          }
        }
      }
      .esri-item-list__scroller {
        position: relative;
        z-index: 0;
      }

      .esri-editor__feature-list-item,
      .esri-item-list__list-item{
        border-color: ${theme.ref.palette.neutral[300]};
        box-shadow: unset;
        :hover{
          border-color: ${theme.ref.palette.neutral[900]};
        }
      }
      .confirm-scrim{
        position: absolute;
        background-color: var(--calcite-scrim-background);
        width: 100%;
        height: 100%;
        top: 0;
      }
      .esri-editor__prompt__actions{
        .esri-editor__warning-option--primary,
        .esri-editor__warning-option--positive{
          text-align: center;
          padding: ${polished.rem(4)} ${polished.rem(16)};
          line-height: ${polished.rem(22)};
          border: 1px solid var(--calcite-ui-danger);
          border-radius: 0;
          flex: 1;
        }
        .esri-editor__warning-option--primary{
          background-color: transparent;
          color: var(--calcite-ui-danger);
          :hover{
            border-color: var(--calcite-ui-danger-hover);
            color: var(--calcite-ui-danger-hover);
            box-shadow: inset 0 0 0 1px var(--calcite-ui-danger-hover);
          }
        }
        .esri-editor__warning-option--positive{
          background-color: var(--calcite-ui-danger);
          color: ${theme.ref.palette.white};
          :hover{
            border-color: var(--calcite-ui-danger-hover);
            background-color: var(--calcite-ui-danger-hover);
          }
        }
      }
      .esri-feature-table__loader-container{
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        margin: unset;
        background-color: ${polished.rgba(
          theme.sys.color.secondary.main,
          0.3
        )};
        .esri-feature-table__loader{
          position: absolute;
          left: 50%;
          top: 50%;
          margin-left: -16px;
          margin-top: -20px;
          z-index: 2;
        }
      }

      .attr-height{
        overflow-y: auto;
        height: calc(100% - 113px);
      }
      .snapping-option{
        position: absolute;
        top: 170px;
        width: calc(100% - 33px);
        margin: 10px 16px;
        padding: 16px 7px 10px;
        border-top: 1px solid ${theme.ref.palette.neutral[400]};
        .snapping-item{
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        }
      }
      .feature-list{
        height: calc(100% - 57px);
        background-color: var(--calcite-ui-background);
        max-height: unset;
        .esri-item-list{
          background-color: unset;
        }
        .esri-item-list__list-item{
          background-color: var(--calcite-ui-foreground-1);
          :hover{
            cursor: pointer;
            background-color: var(--calcite-ui-foreground-2);
          }
        }
        .esri-editor__scroller{
          overflow-y: auto;
          max-height: unset;
        }
      }
      .esri-editor__scroller{
        overflow-y: auto;
        max-height: unset;
        .esri-item-list__scroller{
          max-height: unset;
        }
      }
      .esri-item-list__group{
        padding: 0 12px;
      }
      .esri-editor__message{
        margin: auto;
      }
      .form-header-container{
        border-bottom: 1px solid ${theme.ref.palette.neutral[300]};.
      }
      .esri-editor__header{
        padding-left: unset;
      }
      .back-button{
        width: 32px;
        padding-inline: ${polished.rem(8)};
        padding-block: ${polished.rem(4)};
        line-height: ${polished.rem(16)};
        color: ${theme.ref.palette.black};
        border-top: 0px !important;
        border-left: 0px !important;
        border-bottom: 0px !important;
        border-style: solid;
        border-color: var(--calcite-ui-border-3);
        border-inline-end-width: 1px;
      }
      .layer-selector{
        padding: 12px 15px;
      }
      .single-buttons{
        flex: 1;
      }
      .multi-buttons{
        width: 49%;
      }
      .add-feature-btn{
        position: absolute;
        right: 15px;
        top: 12px;
        button{
          width: 32px;
          height: 32px;
        }
      }
      .back-list-btn{
        position: absolute;
        left: 15px;
        top: 15px;
      }
      .views-resolving-container{
        position: absolute;
        top: 0;
        inset-inline-start: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: ${theme.ref.palette.white};
        z-index: 1;
        .views-resolving-text{
          margin-top: ${polished.rem(8)};
          font-size: ${polished.rem(13)};
          color: ${theme.ref.palette.neutral[700]};
        }
      }
      .edit-blank{
        min-height: 300px;
        .placeholder-icon{
          color: ${theme.ref.palette.neutral[800]};
        }
        & > div{
          top: calc(50% + 20px);
          transform: translateY(-50%);
        }
        p{
          font-size: ${polished.rem(14)};
          margin-top: ${polished.rem(16)};
          line-height: ${polished.rem(19)};
          color: ${theme.ref.palette.neutral[1000]};
        }
      }
    }
  `
}
