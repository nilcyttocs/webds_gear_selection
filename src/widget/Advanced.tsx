import React, { useEffect, useState } from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary, {
  AccordionSummaryProps
} from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { WIDTH } from './constants';
import { Page } from './GearSelectionComponent';
import { Canvas } from './mui_extensions/Canvas';
import { Content } from './mui_extensions/Content';
import { Controls } from './mui_extensions/Controls';

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    marginBottom: '8px'
  },
  '&:before': {
    display: 'none'
  }
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<KeyboardArrowDownIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, .05)'
      : 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)'
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1)
  }
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)'
}));

export const Advanced = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(true);
  const [baselineFrames, setBaselineFrames] = useState<string>(
    props.baselineFrames.toString()
  );
  const [gramDataFrames, setGramDataFrames] = useState<string>(
    props.gramDataFrames.toString()
  );

  const handleDoneButtonClick = () => {
    props.setBaselineFrames(Number(baselineFrames));
    props.setGramDataFrames(Number(gramDataFrames));
    props.changePage(Page.Landing);
  };

  const handleCovarianceInputChange = (id: string, value: string) => {
    if (value !== '' && isNaN(Number(value))) {
      return;
    }
    if (value === '') {
      if (id === 'baselineFrames') {
        setBaselineFrames(value);
      } else if (id === 'gramDataFrames') setGramDataFrames(value);
      return;
    }
    const num = parseInt(value, 10);
    if (num < 4096) {
      if (id === 'baselineFrames') {
        setBaselineFrames(num.toString());
      } else if (id === 'gramDataFrames') setGramDataFrames(num.toString());
    }
  };

  useEffect(() => {
    setInitialized(true);
  }, []);

  return (
    <>
      {initialized ? (
        <Canvas title="Carme Gear Selection" width={WIDTH}>
          <Content
            sx={{
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ margin: '0px auto' }}>
              <Typography>Advanced Settings</Typography>
            </div>
            <div style={{ marginTop: '24px', overflow: 'auto' }}>
              <Accordion>
                <AccordionSummary expandIcon={<KeyboardArrowRightIcon />}>
                  <Typography sx={{ width: '25%', flexShrink: 0 }}>
                    Covariance Params
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    Baseline Frames:&nbsp; {baselineFrames}, Gram Data
                    Frames:&nbsp;{gramDataFrames}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack justifyContent="center" spacing={5} direction="row">
                    <div>
                      <Typography>Baseline Frames</Typography>
                      <FormControl
                        variant="outlined"
                        size="small"
                        sx={{ width: '150px' }}
                      >
                        <OutlinedInput
                          id="baselineFrames"
                          value={baselineFrames}
                          onChange={event =>
                            handleCovarianceInputChange(
                              event.target.id,
                              event.target.value
                            )
                          }
                        />
                      </FormControl>
                    </div>
                    <div>
                      <Typography>Gram Data Frames</Typography>
                      <FormControl
                        variant="outlined"
                        size="small"
                        sx={{ width: '150px' }}
                      >
                        <OutlinedInput
                          id="gramDataFrames"
                          value={gramDataFrames}
                          onChange={event =>
                            handleCovarianceInputChange(
                              event.target.id,
                              event.target.value
                            )
                          }
                        />
                      </FormControl>
                    </div>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </div>
          </Content>
          <Controls
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Button
              disabled={baselineFrames === '' || gramDataFrames === ''}
              onClick={() => handleDoneButtonClick()}
              sx={{ width: '150px' }}
            >
              Done
            </Button>
          </Controls>
        </Canvas>
      ) : null}
    </>
  );
};

export default Advanced;
